import 'server-only';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import {
  createSdkMcpServer,
  query,
  tool,
  type HookCallback,
  type InferShape,
  type McpServerConfig,
  type Options,
  type PostToolUseHookInput,
  type PreToolUseHookInput,
  type SdkMcpToolDefinition,
} from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

// Embedded agents: one directory per agent under .claude/agents/<name>/, each with its
// own AGENTS.md, optional knowledge/, agent-local skills and .mcp.json. The wrapper
// hardcodes no agent names. Every option below is explained, with the
// measurement behind it, in the embedded-agents skill (references/agent-sdk-playbook.md).

const AGENTS_ROOT = resolve(process.cwd(), '.claude', 'agents');
const INSTRUCTIONS = 'AGENTS.md';
// An agent name usually arrives in a request body, so it must be a directory name and
// never a path: `../..` would otherwise resolve to the repo root and its AGENTS.md.
const AGENT_NAME = /^[a-z0-9][a-z0-9-]*$/;
export const DEFAULT_MODEL = 'claude-sonnet-5-5';

export function listAgents(): string[] {
  if (!existsSync(AGENTS_ROOT)) return [];
  return readdirSync(AGENTS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && AGENT_NAME.test(d.name) && existsSync(join(AGENTS_ROOT, d.name, INSTRUCTIONS)))
    .map((d) => d.name)
    .sort();
}

function agentCwd(agent: string): string {
  if (!AGENT_NAME.test(agent)) throw new Error(`Invalid agent name "${agent}"`);
  const dir = join(AGENTS_ROOT, agent);
  if (!existsSync(join(dir, INSTRUCTIONS))) {
    throw new Error(`Agent "${agent}" not found at ${dir} (missing ${INSTRUCTIONS})`);
  }
  return dir;
}

function discoverSkills(agentDir: string): string[] {
  const skillsDir = join(agentDir, '.claude', 'skills');
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(skillsDir, d.name, 'SKILL.md')))
    .map((d) => d.name);
}

function expandEnvVars<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/\$\{([A-Z0-9_]+)\}/gi, (_, name) => process.env[name] ?? '') as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => expandEnvVars(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = expandEnvVars(v);
    }
    return out as unknown as T;
  }
  return value;
}

interface DiscoveredMcp {
  servers: Record<string, McpServerConfig>;
  allowedTools: string[];
}

function discoverMcp(agentDir: string): DiscoveredMcp | undefined {
  const mcpFile = join(agentDir, '.mcp.json');
  if (!existsSync(mcpFile)) return undefined;
  const parsed = JSON.parse(readFileSync(mcpFile, 'utf8')) as {
    mcpServers?: Record<string, McpServerConfig & { allowedTools?: string[] }>;
  };
  if (!parsed.mcpServers) return undefined;

  const servers: Record<string, McpServerConfig> = {};
  const allowedTools: string[] = [];
  for (const [name, raw] of Object.entries(parsed.mcpServers)) {
    const { allowedTools: serverTools, ...rest } = raw;
    servers[name] = expandEnvVars(rest) as McpServerConfig;
    if (Array.isArray(serverTools)) {
      for (const t of serverTools) allowedTools.push(`mcp__${name}__${t}`);
    }
  }
  return { servers, allowedTools };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the SDK's type for a mixed list
export type AgentTool = SdkMcpToolDefinition<any>;

export class ToolError extends Error {}

export const TOOL_FAILED = "The tool failed before it could answer. Say so plainly; don't guess what it would have returned.";

/** One of the app's tools. The in-process MCP server validates input before calling the handler. */
export function agentTool<S extends z.ZodRawShape>(spec: {
  name: string;
  description: string;
  input: S;
  run: (input: InferShape<S>) => Promise<string>;
}): AgentTool {
  return tool(spec.name, spec.description, spec.input, async (input) => {
    try {
      return { content: [{ type: 'text', text: await spec.run(input) }] };
    } catch (error) {
      const text = error instanceof ToolError ? error.message : TOOL_FAILED;
      return { isError: true, content: [{ type: 'text', text }] };
    }
  }) as AgentTool;
}

export interface AskAgentOptions {
  agent: string;
  prompt: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  model?: string;
  maxBudgetUsd?: number;
  maxTurns?: number;
  allowedTools?: string[];
  /** The caller's own tools for this run, built per request so they close over the caller. */
  tools?: AgentTool[];
  /** Extra instructions appended after AGENTS.md for this run (never user text). */
  context?: string;
}

export interface AgentMetadata {
  cost: number;
  duration_ms: number;
  filesRead: string[];
  tokens: number;
}

export type AgentEvent =
  | { type: 'text'; text: string }
  | { type: 'done'; text: string; metadata: AgentMetadata }
  // The run stopped without an answer: max turns, max budget, or an execution error.
  | { type: 'error'; text: string; subtype: string; metadata: AgentMetadata };

// The path guard confines file access to the agent's own directory and blocks env files.
// Checking for `..` alone is not enough: an absolute path walks straight out.
export function isBlockedPath(agentDir: string, toolName: string, input: Record<string, unknown> | undefined): boolean {
  const candidates = [input?.file_path, input?.path, input?.glob, toolName === 'Glob' ? input?.pattern : undefined];
  return candidates.some((c) => {
    if (typeof c !== 'string' || c === '') return false;
    if (/\.env/i.test(c)) return true; // Windows and macOS open .ENV as .env.
    const rel = relative(agentDir, resolve(agentDir, c));
    return rel.startsWith('..') || isAbsolute(rel);
  });
}

export function composePrompt(prompt: string, history: AskAgentOptions['history'] = []): string {
  const historyBlock = history
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');
  return historyBlock ? `Previous conversation:\n${historyBlock}\n\nNew question: ${prompt}` : prompt;
}

// The options every call gets. Exported so the contract can be unit-tested without a model call.
export function agentOptions(opts: Omit<AskAgentOptions, 'prompt' | 'history'>, filesRead: string[] = []): Options {
  const cwd = agentCwd(opts.agent);
  const mcp = discoverMcp(cwd);
  // Consultations use their own query. Reserve both names of the native subagent tool.
  const allowedTools = (opts.allowedTools ?? ['Read', 'Glob', 'Grep', ...(mcp?.allowedTools ?? [])])
    .filter((name) => name !== 'Agent' && name !== 'Task');
  let mcpServers = mcp?.servers;
  const appToolNames: string[] = [];
  if (opts.tools?.length) {
    if (mcpServers?.app) throw new Error(`Agent "${opts.agent}" already has an MCP server named "app"`);
    const names = opts.tools.map((t) => t.name);
    const duplicate = names.find((name, i) => names.indexOf(name) !== i);
    if (duplicate !== undefined) throw new Error(`Agent "${opts.agent}" has two tools named "${duplicate}"`);
    appToolNames.push(...names.map((name) => `mcp__app__${name}`));
    mcpServers = { ...mcpServers, app: createSdkMcpServer({ name: 'app', tools: opts.tools }) };
  }
  const instructions = readFileSync(join(cwd, INSTRUCTIONS), 'utf8');
  const append = opts.context ? `${instructions}\n\n${opts.context}` : instructions;
  return {
    cwd,
    // 'project' is what discovers agent-local skills; the SDK does not load AGENTS.md itself.
    settingSources: ['project'],
    // The agent's AGENTS.md is appended to the preset, which is what makes it authoritative.
    systemPrompt: { type: 'preset', preset: 'claude_code', append },
    skills: discoverSkills(cwd),
    strictMcpConfig: true,
    mcpServers,
    // `allowedTools` only auto-approves. `tools` is what makes every other built-in tool
    // (Bash, Write, Edit, WebFetch…) unavailable, and 'dontAsk' denies anything not approved —
    // including an MCP tool the agent's .mcp.json did not list.
    tools: allowedTools.filter((t) => !t.startsWith('mcp__')),
    allowedTools: appToolNames.length ? [...allowedTools, ...appToolNames] : allowedTools,
    permissionMode: 'dontAsk',
    model: opts.model ?? DEFAULT_MODEL,
    maxTurns: opts.maxTurns ?? 10,
    maxBudgetUsd: opts.maxBudgetUsd,
    hooks: {
      PreToolUse: [
        {
          hooks: [
            (async (input) => {
              const i = input as PreToolUseHookInput;
              if (!appToolNames.includes(i.tool_name) && isBlockedPath(cwd, i.tool_name, i.tool_input as Record<string, unknown> | undefined)) {
                return { decision: 'block' as const, reason: "Access denied: outside the agent's directory, or an env file" };
              }
              return {};
            }) as HookCallback,
          ],
        },
      ],
      PostToolUse: [
        {
          hooks: [
            (async (input) => {
              const i = input as PostToolUseHookInput;
              if (i.tool_name === 'Read') {
                const t = i.tool_input as Record<string, string> | undefined;
                // Relative to the agent: the list reaches the browser, the server's layout must not.
                if (t?.file_path) filesRead.push(relative(cwd, resolve(cwd, t.file_path)).replace(/\\/g, '/'));
              }
              return {};
            }) as HookCallback,
          ],
        },
      ],
    },
  };
}

export async function* askAgent(opts: AskAgentOptions): AsyncGenerator<AgentEvent> {
  const filesRead: string[] = [];
  const options = agentOptions(opts, filesRead);
  let fullText = '';
  let finished = false;

  try {
    for await (const msg of query({ prompt: composePrompt(opts.prompt, opts.history), options })) {
      if (msg.type === 'assistant') {
        const text = msg.message.content
          .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
          .map((b) => b.text)
          .join('');
        if (text) {
          fullText += text;
          yield { type: 'text', text };
        }
      }
      if (msg.type === 'result') {
        const metadata: AgentMetadata = {
          cost: msg.total_cost_usd ?? 0,
          duration_ms: msg.duration_ms ?? 0,
          filesRead,
          tokens: (msg.usage?.input_tokens ?? 0) + (msg.usage?.output_tokens ?? 0),
        };
        finished = true;
        if (msg.subtype === 'success') yield { type: 'done', text: fullText, metadata };
        else yield { type: 'error', text: fullText, subtype: msg.subtype, metadata };
      }
    }
  } catch (err) {
    // After a non-success result the SDK also throws ("Claude Code returned an error result").
    // The error event above already carries it, so the caller gets one signal, not two.
    if (!finished) throw err;
  }
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
export function askSpecialist({ agent, description, tools, runs, context, model, maxTurns, maxBudgetUsd, allowedTools }: {
  agent: string;
  description: string;
  tools: AgentTool[];
  runs: SpecialistRuns;
  context?: string;
  model?: string;
  maxTurns?: number;
  maxBudgetUsd?: number;
  allowedTools?: string[];
}) {
  agentCwd(agent);
  if (tools.some((tool) => tool.name.startsWith('ask_'))) throw new Error(`Remove consult tools from the ${agent} specialist.`);
  return {
    name: `ask_${agent.replace(/-/g, '_')}`,
    description,
    input: { question: z.string().min(1) },
    async run({ question }: { question: string }) {
      runs.take(); // Reserve the slot before any await: the runner can call several tools at once.
      for await (const event of askAgent({ agent, prompt: question, tools, context, model, maxTurns, maxBudgetUsd, allowedTools })) {
        if (event.type === 'text') continue;
        runs.runs.push({ agent, metadata: event.metadata });
        if (event.type === 'error') throw new ToolError(`The ${agent} specialist stopped before answering (${event.subtype}).`);
        if (event.text.trim()) return event.text;
      }
      throw new ToolError(`The ${agent} specialist finished without an answer.`);
    },
  };
}
