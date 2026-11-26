import 'server-only';
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { ToolError } from '@anthropic-ai/sdk/lib/tools/ToolError';
import type { BetaRunnableTool, BetaToolRunContext } from '@anthropic-ai/sdk/lib/tools/BetaRunnableTool';
import type { BetaManagedAgentsAgentWithOverridesParams, SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import type { BetaManagedAgentsAgentCustomToolUseEvent, BetaManagedAgentsSessionUsageSnapshot } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import { z } from 'zod';

const AGENTS_ROOT = resolve(process.cwd(), '.claude', 'agents');
const INSTRUCTIONS = 'AGENTS.md';
const KNOWLEDGE = 'knowledge';
const AGENT_NAME = /^[a-z0-9][a-z0-9-]*$/;
const MAX_FILE_BYTES = 256 * 1024;
const DEFAULT_TIMEOUT_MS = 120_000;
const RETRY_MS = 400;
const RETRIES = 10;
const APP = 'embedded-agents-managed'; // Set to a stable app identifier if sharing a base agent.
export const DEFAULT_MODEL = 'claude-sonnet-5-5';

let client: Anthropic | undefined;
const agentClient = () => (client ??= new Anthropic({ timeout: DEFAULT_TIMEOUT_MS, logLevel: 'off' }));

export function listAgents(): string[] {
  if (!existsSync(AGENTS_ROOT)) return [];
  return readdirSync(AGENTS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && AGENT_NAME.test(d.name) && existsSync(join(AGENTS_ROOT, d.name, INSTRUCTIONS)))
    .map((d) => d.name)
    .sort();
}

export function agentDir(agent: string): string {
  if (!AGENT_NAME.test(agent)) throw new Error(`Invalid agent name "${agent}"`);
  const dir = join(AGENTS_ROOT, agent);
  if (!existsSync(join(dir, INSTRUCTIONS))) {
    throw new Error(`Agent "${agent}" not found at ${dir} (missing ${INSTRUCTIONS})`);
  }
  return dir;
}

/** A tool the runner can call: its definition, plus `parse` and `run`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the runner's own type for a mixed list
export type AgentTool = BetaRunnableTool<any>;

/** What a tool says when it fails in a way it did not plan for. */
export const TOOL_FAILED = "The tool failed before it could answer. Say so plainly; don't guess what it would have returned.";

/** A tool whose unplanned exceptions reach the model as TOOL_FAILED: a message can carry a vendor's internals or a credential. */
export function guarded(tool: AgentTool): AgentTool {
  return {
    ...tool,
    run: async (input, context) => {
      try {
        return await tool.run(input, context);
      } catch (error) {
        if (error instanceof ToolError) throw error;
        throw new ToolError(TOOL_FAILED);
      }
    },
  };
}

/**
 * One of the app's own tools. `run` returns the text the model reads; a refusal or a planned
 * failure throws a `ToolError` with the text instead, which the model reads as an error result.
 * The input is validated against `input` before `run` sees it.
 */
export function agentTool<S extends z.ZodRawShape>(spec: {
  name: string;
  description: string;
  input: S;
  run: (input: z.infer<z.ZodObject<S>>, context?: BetaToolRunContext) => Promise<string>;
}): AgentTool {
  return guarded(betaZodTool({ name: spec.name, description: spec.description, inputSchema: z.object(spec.input), run: spec.run }));
}
export { ToolError };

// ── Files the agent may read: knowledge/ and its own skills, nothing else ────────────────────────

/** `path` inside `root`, symlinks resolved, or null. Never an env file, never `root` itself. */
export function inside(root: string, path: string): string | null {
  try {
    const base = realpathSync(root);
    const real = realpathSync(resolve(base, path));
    const rel = relative(base, real);
    const env = rel.split(/[\\/]/).some((part) => /^\.env/i.test(part)); // Windows and macOS open .ENV as .env.
    return rel && !env && !rel.startsWith('..') && !isAbsolute(rel) ? real : null;
  } catch {
    return null;
  }
}

/** Every regular file under `dir`, as relative paths; hidden files and symlinks are left out. */
function filesUnder(dir: string, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((d) => {
      if (d.name.startsWith('.')) return [];
      const rel = prefix ? `${prefix}/${d.name}` : d.name;
      return d.isDirectory() ? filesUnder(join(dir, d.name), rel) : d.isFile() ? [rel] : [];
    })
    .sort();
}

function readInside(root: string, path: string, shown: string): string {
  const file = inside(root, path);
  if (!file || !statSync(file).isFile()) throw new ToolError(`There is no file ${shown}.`);
  if (statSync(file).size > MAX_FILE_BYTES) throw new ToolError(`${shown} is over ${MAX_FILE_BYTES / 1024} KB, too large to read whole.`);
  return readFileSync(file, 'utf8');
}

function knowledgeTools(dir: string, filesRead: string[]): AgentTool[] {
  const root = join(dir, KNOWLEDGE);
  if (!existsSync(root)) return [];
  const terms = (query: string) => [...new Set(query.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 1))];
  return [
    agentTool({
      name: 'list_files',
      description: 'List the files in knowledge/, the reference files you answer from.',
      input: {},
      run: async () => filesUnder(root).map((f) => `${KNOWLEDGE}/${f}`).join('\n') || 'knowledge/ is empty.',
    }),
    agentTool({
      name: 'read_file',
      description: 'Read one file from knowledge/ in full, by its path as list_files gives it (e.g. knowledge/okrs.md).',
      input: { path: z.string().min(1).max(300) },
      run: async ({ path }) => {
        const rel = path.replace(/\\/g, '/').replace(/^\.?\/?knowledge\//, '');
        const text = readInside(root, rel, path);
        filesRead.push(`${KNOWLEDGE}/${rel}`);
        return text;
      },
    }),
    agentTool({
      name: 'search_files',
      description: 'Find the lines in knowledge/ that contain any of these words, case-insensitively. Returns path:line: text, best matches first.',
      input: { query: z.string().min(2).max(200).describe('A few keywords') },
      run: async ({ query }) => {
        const words = terms(query);
        if (!words.length) throw new ToolError('Give at least one word of two letters or more.');
        const hits = filesUnder(root).flatMap((f) => {
          const file = inside(root, f);
          if (!file || statSync(file).size > MAX_FILE_BYTES) return [];
          return readFileSync(file, 'utf8').split(/\r?\n/).flatMap((line, i) => {
            const score = words.filter((w) => line.toLowerCase().includes(w)).length;
            return score ? [{ score, at: `${KNOWLEDGE}/${f}:${i + 1}: ${line.trim().slice(0, 300)}` }] : [];
          });
        });
        return hits.sort((a, b) => b.score - a.score).slice(0, 40).map((h) => h.at).join('\n') || 'No line matches. list_files shows every file.';
      },
    }),
  ];
}

export interface Skill { name: string; description: string; dir: string }

/** The agent's own skills: `.claude/skills/<name>/SKILL.md`, described by its frontmatter. */
export function discoverSkills(agentDir: string): Skill[] {
  const root = join(agentDir, '.claude', 'skills');
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && AGENT_NAME.test(d.name) && existsSync(join(root, d.name, 'SKILL.md')))
    .map((d) => {
      const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(join(root, d.name, 'SKILL.md'), 'utf8'))?.[1] ?? '';
      const description = /^description:\s*(.+)$/m.exec(front)?.[1].trim().replace(/^(["'])(.*)\1$/, '$2') ?? '';
      return { name: d.name, description, dir: join(root, d.name) };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function skillIndex(skills: Skill[]): string {
  if (!skills.length) return '';
  return [
    '',
    '',
    '## Skills',
    'Each skill holds the instructions for one kind of task. When a task matches one, call load_skill with its name before you start, then follow it.',
    ...skills.map((s) => `- ${s.name}: ${s.description}`),
  ].join('\n');
}

function skillTools(skills: Skill[], filesRead: string[]): AgentTool[] {
  if (!skills.length) return [];
  const names = skills.map((s) => s.name) as [string, ...string[]];
  const skill = (name: string) => skills.find((s) => s.name === name)!;
  const read = (name: string, path: string) => {
    const text = readInside(skill(name).dir, path, `${path} in the ${name} skill`);
    filesRead.push(`.claude/skills/${name}/${path.replace(/\\/g, '/')}`);
    return text;
  };
  return [
    agentTool({
      name: 'load_skill',
      description: 'Load one of your skills: its instructions, and the names of its other files.',
      input: { name: z.enum(names) },
      run: async ({ name }) => {
        const others = filesUnder(skill(name).dir).filter((f) => f !== 'SKILL.md');
        const text = read(name, 'SKILL.md');
        return others.length ? `${text}\n\nOther files in this skill (read them with read_skill_file): ${others.join(', ')}` : text;
      },
    }),
    agentTool({
      name: 'read_skill_file',
      description: 'Read one file of a skill, by the path load_skill listed.',
      input: { name: z.enum(names), path: z.string().min(1).max(300) },
      run: async ({ name, path }) => read(name, path),
    }),
  ];
}

// ── The request and the run ──────────────────────────────────────────────────────────────────────

export interface AskAgentOptions {
  agent: string;
  prompt: string;
  owner: string;
  sessionId?: string;
  tools?: AgentTool[];
  /** App-supplied facts for a new session. Never include user text. */
  context?: string;
  model?: string;
  maxTurns?: number;
  maxBudgetUsd?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface AgentMetadata {
  cost: number;
  duration_ms: number;
  filesRead: string[];
  tokens: number;
}

export type AgentEvent =
  | { type: 'session'; sessionId: string }
  | { type: 'text'; text: string }
  | { type: 'done'; text: string; sessionId: string; metadata: AgentMetadata }
  | { type: 'error'; text: string; sessionId: string; subtype: string; metadata: AgentMetadata };

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} before using Managed Agents.`);
  return value;
}

function agentTools(opts: Pick<AskAgentOptions, 'agent' | 'tools'>, filesRead: string[]) {
  const dir = agentDir(opts.agent);
  if (existsSync(join(dir, '.mcp.json'))) {
    throw new Error('Managed Agents refuses .mcp.json. Use the Messages API or Agent SDK runtime of the embedded-agents skill for MCP.');
  }
  const skills = discoverSkills(dir);
  const tools = [...(opts.tools ?? []), ...knowledgeTools(dir, filesRead), ...skillTools(skills, filesRead)];
  const byName = new Map<string, AgentTool>();
  for (const tool of tools) {
    if (byName.has(tool.name)) throw new Error(`Agent "${opts.agent}" has two tools named "${tool.name}"`);
    if (tool.type !== 'custom') throw new Error(`Tool "${tool.name}" must be a custom tool.`);
    byName.set(tool.name, tool);
  }
  return { dir, skills, tools, byName };
}

type SessionOptions = Omit<AskAgentOptions, 'prompt' | 'sessionId'>;
function createParams(opts: SessionOptions, { dir, skills, tools }: ReturnType<typeof agentTools>): SessionCreateParams {
  const file = join(dir, 'hosted.json');
  const hosted = z.union([z.tuple([z.literal('code')]), z.tuple([z.literal('search')]), z.tuple([])]);
  let value: unknown = [];
  if (existsSync(file)) {
    try {
      value = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      throw new Error('hosted.json must be a JSON array containing at most one hosted tool.');
    }
  }
  const choice = hosted.safeParse(value);
  if (!choice.success) throw new Error('hosted.json must contain ["code"], ["search"], or []. Choose at most one hosted tool.');
  const [mode] = choice.data;
  const definitions: NonNullable<BetaManagedAgentsAgentWithOverridesParams['tools']> = tools.map((tool) => {
    if (tool.type !== 'custom' || !tool.description) throw new Error(`Tool "${tool.name}" needs a custom tool description.`);
    const { properties, required } = tool.input_schema;
    if (properties != null && (typeof properties !== 'object' || Array.isArray(properties))) {
      throw new Error(`Tool "${tool.name}" needs an object for its schema properties.`);
    }
    return {
      type: 'custom', name: tool.name, description: tool.description,
      input_schema: {
        ...tool.input_schema,
        properties: properties == null ? properties : { ...properties },
        required: required == null ? required : [...required],
      },
    };
  });
  if (mode) definitions.push({
    type: 'agent_toolset_20260401',
    default_config: { enabled: false },
    configs: [{ name: mode === 'code' ? 'bash' : 'web_search', enabled: true, permission_policy: { type: 'always_allow' } }],
  });
  const budget = opts.maxBudgetUsd ?? 1;
  const cents = Math.round(budget * 100);
  if (!Number.isSafeInteger(cents) || cents < 1 || budget !== cents / 100) {
    throw new Error('maxBudgetUsd must be a positive amount in whole cents.');
  }
  return {
    agent: {
      type: 'agent_with_overrides',
      id: required('CLAUDE_AGENT_ID'),
      model: { id: opts.model ?? DEFAULT_MODEL, effort: 'medium' },
      system: readFileSync(join(dir, INSTRUCTIONS), 'utf8') + skillIndex(skills) + (opts.context ? `\n\n${opts.context}` : ''),
      tools: definitions,
      mcp_servers: [],
      skills: [],
    },
    environment_id: required(mode === 'search' ? 'CLAUDE_SEARCH_ENVIRONMENT_ID' : 'CLAUDE_ENVIRONMENT_ID'),
    budget: { type: 'limit', max_list_cost: { amount: String(cents), currency: 'USD' } },
    metadata: { owner: opts.owner, agent: opts.agent, app: APP },
  };
}

/** The cloud configuration for one new session. */
export function sessionRequest(opts: SessionOptions): SessionCreateParams {
  return createParams(opts, agentTools(opts, []));
}

export class NoSuchSession extends Error {
  constructor() {
    super('No such session.');
    this.name = 'NoSuchSession';
  }
}

function belongsTo(s: Anthropic.Beta.BetaManagedAgentsSession, owner: string, base: string): boolean {
  return Boolean(owner) && s.agent.id === base && s.metadata.app === APP
    && s.metadata.owner === owner && AGENT_NAME.test(s.metadata.agent ?? '');
}

async function ownedSession(sessionId: string, owner: string, client: Anthropic, opts?: AskAgentOptions) {
  const base = required('CLAUDE_AGENT_ID');
  const session = await client.beta.sessions.retrieve(sessionId, {}, { signal: opts?.signal, timeout: opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS })
    .catch((error: unknown) => {
      if (error instanceof Anthropic.NotFoundError) throw new NoSuchSession();
      throw error;
    });
  if (!belongsTo(session, owner, base) || (opts && session.metadata.agent !== opts.agent)) throw new NoSuchSession();
  return session;
}

const textOf = (content: readonly { type: string; text?: string }[]) =>
  content.map((block) => block.type === 'text' ? block.text ?? '' : '').join('');

export async function transcript(sessionId: string, owner: string, client: Anthropic = agentClient()) {
  await ownedSession(sessionId, owner, client);
  const messages: { role: 'user' | 'assistant'; text: string }[] = [];
  for await (const event of client.beta.sessions.events.list(sessionId, { order: 'asc', types: ['user.message', 'agent.message'] })) {
    if (event.type === 'user.message' || event.type === 'agent.message') {
      messages.push({ role: event.type === 'user.message' ? 'user' : 'assistant', text: textOf(event.content) });
    }
  }
  return messages;
}

const refusedFor = (reason: RegExp, error: unknown) => error instanceof Anthropic.BadRequestError && reason.test(error.message);

/** A running session refuses deletion with a 400, so it is stopped first. */
async function remove(id: string, client: Anthropic) {
  for (let attempt = 1; ; attempt++) {
    try {
      await client.beta.sessions.delete(id);
      return;
    } catch (error) {
      if (error instanceof Anthropic.NotFoundError) return;
      if (attempt > RETRIES || !refusedFor(/while it is running/i, error)) throw error;
      if (attempt === 1) await client.beta.sessions.events.send(id, { events: [{ type: 'user.interrupt' }] });
      await delay(RETRY_MS);
    }
  }
}

export async function deleteSession(sessionId: string, owner: string, client: Anthropic = agentClient()) {
  await ownedSession(sessionId, owner, client);
  await remove(sessionId, client);
}

export async function deleteOwnerSessions(owner: string, client: Anthropic = agentClient()) {
  const agent_id = required('CLAUDE_AGENT_ID');
  const ids: string[] = [];
  for await (const session of client.beta.sessions.list({ agent_id, include_archived: true })) {
    if (belongsTo(session, owner, agent_id)) ids.push(session.id);
  }
  for (const id of ids) await remove(id, client);
}

type SessionEvents = Anthropic['beta']['sessions']['events'];

/** Sends the message once, and returns the id its echo will carry. An unanswered tool call is interrupted first. */
async function sendMessage(events: SessionEvents, id: string, prompt: string, signal: AbortSignal): Promise<string> {
  // Never retried by the SDK: a message that was accepted before the connection broke would run twice.
  const send = () => events.send(id, { events: [{ type: 'user.message', content: [{ type: 'text', text: prompt }] }] }, { signal, maxRetries: 0 });
  const waiting = (error: unknown) => refusedFor(/waiting on responses to events/i, error);
  const accepted = await send().catch(async (error: unknown) => {
    if (!waiting(error)) throw error;
    await events.send(id, { events: [{ type: 'user.interrupt' }] }, { signal });
    for (let attempt = 1; ; attempt++) {
      await delay(RETRY_MS, undefined, { signal });
      try {
        return await send();
      } catch (retryError) {
        if (attempt === RETRIES || !waiting(retryError)) throw retryError;
      }
    }
  });
  const echo = accepted.data?.find((event) => event.type === 'user.message');
  if (!echo) throw new Error('Managed Agents did not return the accepted user message.');
  return echo.id;
}

async function toolResult(tool: AgentTool | undefined, call: BetaManagedAgentsAgentCustomToolUseEvent, signal: AbortSignal) {
  if (!tool) return { text: `There is no tool ${call.name}.`, is_error: true };
  let input: unknown;
  try {
    input = tool.parse(call.input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fields = error.issues.map(({ path }) => path.map(String).join('.') || 'input');
      return { text: `Invalid tool input. Check these fields: ${[...new Set(fields)].join(', ')}.`, is_error: true };
    }
    return { text: TOOL_FAILED, is_error: true };
  }
  try {
    const output = await tool.run(input, { toolUse: call, toolUseBlock: call, signal });
    return { text: typeof output === 'string' ? output : textOf(output), is_error: false };
  } catch (error) {
    return { text: error instanceof ToolError ? error.message : TOOL_FAILED, is_error: true };
  }
}

/** Check ownership and prepare the session before the HTTP response commits to streaming. */
export async function openSession(opts: AskAgentOptions, client: Anthropic = agentClient()) {
  if (!opts.owner) throw new Error('Managed Agents requires a caller.');
  const started = Date.now();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const previous = opts.sessionId ? await ownedSession(opts.sessionId, opts.owner, client, opts) : undefined;
  const filesRead: string[] = [];
  const local = agentTools(opts, filesRead);
  const sessionId = previous?.id ?? (await client.beta.sessions.create(createParams(opts, local), {
    signal: opts.signal, timeout: timeoutMs, maxRetries: 0,
  })).id;
  // A resumed session can call only the tools it was created with.
  const advertised = previous && new Set(previous.agent.tools.flatMap((tool) => tool.type === 'custom' ? [tool.name] : []));
  return runSession(opts, client.beta.sessions.events, sessionId, local.byName, advertised, filesRead, started, timeoutMs);
}

export async function* askAgent(opts: AskAgentOptions, client?: Anthropic): AsyncGenerator<AgentEvent> {
  yield* await openSession(opts, client);
}

async function* runSession(
  opts: AskAgentOptions, events: SessionEvents, sessionId: string, tools: Map<string, AgentTool>,
  advertised: Set<string> | undefined, filesRead: string[], started: number, timeoutMs: number,
): AsyncGenerator<AgentEvent> {
  const controller = new AbortController();
  const signal = opts.signal ? AbortSignal.any([controller.signal, opts.signal]) : controller.signal;
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, Math.max(0, timeoutMs - (Date.now() - started)));
  const previews = new Map<string, number>();
  let usage: BetaManagedAgentsSessionUsageSnapshot = {};
  let text = '';
  let speaking = '';
  let turns = 0;
  let interruptOnExit = false;
  let sending = false;
  let postingFailed = false;
  let stream: Awaited<ReturnType<SessionEvents['stream']>> | undefined;
  let stop = 'error_disconnected';
  try {
    yield { type: 'session', sessionId };
    signal.throwIfAborted();
    stream = await events.stream(sessionId, { event_deltas: ['agent.message'] }, { signal });
    sending = true;
    const echo = await sendMessage(events, sessionId, opts.prompt, signal);
    sending = false;
    interruptOnExit = true;
    let ours = false;
    for await (const event of stream) {
      if (signal.aborted) break;
      if (event.type === 'user.message') {
        if (event.id === echo) ours = true;
        else if (ours) { stop = 'done'; interruptOnExit = false; break; }
      }
      if (!ours) continue;
      if (event.type === 'span.model_request_start') turns++;
      if (event.type === 'session.usage') usage = event.usage;
      if (event.type === 'event_start' && event.event.type === 'agent.message') previews.set(event.event.id, 0);

      let chunk = '';
      let from = '';
      if (event.type === 'event_delta' && (event.delta.index ?? 0) === 0 && previews.has(event.event_id)) {
        // Only preview the first block so a truncated prefix cannot strand a later block ahead of it.
        from = event.event_id;
        chunk = event.delta.content.text;
        previews.set(event.event_id, previews.get(event.event_id)! + chunk.length);
      }
      if (event.type === 'agent.message') {
        from = event.id;
        chunk = textOf(event.content).slice(previews.get(event.id) ?? 0);
        previews.delete(event.id);
      }
      if (chunk) {
        // What the agent says after a tool call is a new paragraph, not the end of the last sentence.
        if (text && from !== speaking) chunk = `\n\n${chunk}`;
        speaking = from;
        text += chunk;
        yield { type: 'text', text: chunk };
      }
      if (event.type === 'agent.custom_tool_use' || event.type === 'agent.tool_use') {
        if (turns >= (opts.maxTurns ?? 10)) { stop = 'error_max_turns'; break; }
        if (event.type === 'agent.custom_tool_use') {
          const tool = !advertised || advertised.has(event.name) ? tools.get(event.name) : undefined;
          void toolResult(tool, event, signal).then(async (result) => {
            if (signal.aborted) return;
            await events.send(sessionId, {
              events: [{
                type: 'user.custom_tool_result', custom_tool_use_id: event.id, is_error: result.is_error,
                content: [{ type: 'text', text: result.text }],
              }],
            }, { signal }); // Safe to retry: a second result for one call is ignored.
          }).catch(() => {
            if (!signal.aborted) { postingFailed = true; controller.abort(); }
          });
        }
      }
      if (event.type === 'session.status_idle' && event.stop_reason.type !== 'requires_action') {
        stop = event.stop_reason.type === 'end_turn' ? (text ? 'done' : 'error_no_response')
          : event.stop_reason.type === 'budget_reached' ? 'error_max_budget_usd' : event.stop_reason.type;
        interruptOnExit = false;
        break;
      }
      if (event.type === 'session.status_terminated' || event.type === 'session.deleted') {
        stop = event.type === 'session.deleted' ? 'error_disconnected' : 'terminated';
        interruptOnExit = false;
        break;
      }
      // The status event closes retryable session errors with the final stop reason.
      if (event.type === 'session.error' && !('retry_status' in event.error)) {
        stop = 'error_session';
        break;
      }
    }
    if (stop === 'error_disconnected' && !signal.aborted) interruptOnExit = false;
  } catch (error) {
    if (sending && refusedFor(/budget reached/i, error)) stop = 'error_max_budget_usd';
    else if (!signal.aborted && sending) throw error;
    if (!signal.aborted) interruptOnExit = false;
  } finally {
    clearTimeout(timeout);
    controller.abort();
    stream?.controller.abort();
    if (interruptOnExit) {
      await events.send(sessionId, { events: [{ type: 'user.interrupt' }] }, {
        signal: AbortSignal.timeout(3000),
      }).catch(() => {});
    }
  }
  if (timedOut) stop = 'error_timeout';
  else if (postingFailed) stop = 'error_tool_result';
  const metadata = {
    cost: Number(usage.list_cost?.amount ?? 0) / 100,
    duration_ms: Date.now() - started,
    filesRead,
    tokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0)
      + (usage.cache_creation?.ephemeral_5m_input_tokens ?? 0) + (usage.cache_creation?.ephemeral_1h_input_tokens ?? 0),
  };
  if (stop === 'done') yield { type: 'done', sessionId, text, metadata };
  else yield { type: 'error', sessionId, text, subtype: stop, metadata };
}

export interface SpecialistRuns {
  readonly max: number;
  readonly started: number;
  readonly runs: { agent: string; metadata: AgentMetadata }[];
  take(): void;
}

/** One counter per message, shared by all of the lead's consult tools. */
export function specialistRuns(max: number): SpecialistRuns {
  if (!Number.isSafeInteger(max) || max < 0) throw new RangeError('The specialist run limit must be a non-negative integer.');
  let started = 0;
  return {
    max,
    get started() { return started; },
    runs: [],
    take() {
      if (started >= max) throw new ToolError('This message has reached its specialist run limit.');
      started += 1;
    },
  };
}

/** A caller tool spec for the lead. Wrap it with agentTool like any other spec. */
export function askSpecialist({ agent, description, tools, runs, owner, context, model, maxTurns, maxBudgetUsd, timeoutMs, signal }: {
  agent: string;
  description: string;
  tools: AgentTool[];
  runs: SpecialistRuns;
  owner: string;
  context?: string;
  model?: string;
  maxTurns?: number;
  maxBudgetUsd?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}, client?: Anthropic) {
  agentDir(agent);
  if (tools.some((tool) => tool.name.startsWith('ask_'))) throw new Error(`Remove consult tools from the ${agent} specialist.`);
  return {
    name: `ask_${agent.replace(/-/g, '_')}`,
    description,
    input: { question: z.string().min(1) },
    async run({ question }: { question: string }, toolContext?: BetaToolRunContext) {
      const leadSignal = toolContext?.signal;
      const consultationSignal = signal && leadSignal ? AbortSignal.any([signal, leadSignal]) : leadSignal ?? signal;
      consultationSignal?.throwIfAborted();
      runs.take(); // Reserve the slot before any await: the runner can call several tools at once.
      const sessionClient = client ?? agentClient();
      let sessionId: string | undefined;
      try {
        const events = await openSession({
          agent, prompt: question, tools, owner, context, model, maxTurns, maxBudgetUsd, timeoutMs, signal: consultationSignal,
        }, sessionClient);
        for await (const event of events) {
          if (event.type === 'session') {
            sessionId = event.sessionId;
            continue;
          }
          if (event.type === 'text') continue;
          runs.runs.push({ agent, metadata: event.metadata });
          if (event.type === 'error') throw new ToolError(`The ${agent} specialist stopped before answering (${event.subtype}).`);
          if (event.text.trim()) return event.text;
        }
        throw new ToolError(`The ${agent} specialist finished without an answer.`);
      } finally {
        // The session was just created for this caller. If deletion fails, account cleanup still finds it.
        if (sessionId) await remove(sessionId, sessionClient).catch(() => {});
      }
    },
  };
}
