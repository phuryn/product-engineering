import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, vi } from 'vitest';
import { z } from 'zod';
import { AGENT_TOOLS } from '@/lib/agent-tools';

vi.mock('server-only', () => ({}));

const ROOT = '.claude/agents';
const DOC = 'docs/automation.md';
const HEADER = /^\|\s*Tool\s*\|\s*Kind\s*\|\s*What it does\s*\|$/m;
const kinds = ['reads', 'shows', 'writes', 'proposes', 'wrapper'];
const identity = /^(email|person|user|member|customer|account|owner|workspace|tenant|org|organization)(?:_?id)?$/i;

function toolRows(doc: string, agent: string) {
  const lines = doc.split(/\r?\n/);
  const heading = `Agent card: ${agent}`;
  const starts = lines.flatMap((line, i) => line.replace(/^#{1,6} /, '') === heading && line.startsWith('#') ? [i] : []);
  expect(starts, `Add exactly one heading "### ${heading}" in ${DOC}.`).toHaveLength(1);
  const card = lines.slice(starts[0] + 1).join('\n').split(/^#{1,6} /m)[0];
  const table = card.split(HEADER);
  expect(table, `Add exactly one "| Tool | Kind | What it does |" table under ${heading}.`).toHaveLength(2);
  const [separator, ...rows] = table[1].trimStart().split('\n');
  expect(separator, `Add the Markdown separator under the tool table header for ${agent}.`).toMatch(/^\|(?:\s*:?-{3,}:?\s*\|){3}\s*$/);
  const end = rows.findIndex((row) => !row.startsWith('|'));
  return (end < 0 ? rows : rows.slice(0, end)).map((row) => {
    const [, name, kind, detail] = row.split('|');
    expect(name?.trim() && kind?.trim() && detail?.trim(), `Fill every column in ${agent}'s tool row: ${row}`).toBeTruthy();
    return { name: name.trim().replace(/^`([^`]+)`$/, '$1'), kind: kind.trim() };
  });
}

/** Tools the agent's own files switch on, each with the names its row may use. */
function configuredTools(agent: string): string[][] {
  const read = (file: string) => {
    const path = join(ROOT, agent, file);
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined;
  };
  const hosted: string[] = read('hosted.json') ?? [];
  const servers: Record<string, { allowedTools?: string[] }> = read('.mcp.json')?.mcpServers ?? {};
  return [
    ...hosted.map((mode) => [mode === 'code' ? 'bash' : mode === 'search' ? 'web_search' : mode]),
    ...Object.entries(servers).flatMap(([server, { allowedTools = [] }]) => allowedTools.map((tool) => [tool, `mcp__${server}__${tool}`])),
  ];
}

function identityFields(schema: unknown, path = '$'): string[] {
  if (!schema || typeof schema !== 'object') return [];
  return Object.entries(schema).flatMap(([key, value]) => {
    if (key === 'properties') {
      return Object.entries(value).flatMap(([name, child]) => {
        const field = `${path}.${name}`;
        return [...(identity.test(name) ? [field] : []), ...identityFields(child, field)];
      });
    }
    // Include unions, arrays, and referenced definitions, and skip data and annotations.
    if (['items', 'prefixItems', 'anyOf', 'oneOf', 'allOf', 'additionalProperties', '$defs', 'definitions'].includes(key) || /^\d+$/.test(key)) {
      if (key === '$defs' || key === 'definitions') return Object.values(value).flatMap((child) => identityFields(child, `${path}.${key}`));
      return identityFields(value, `${path}.${key}`);
    }
    return [];
  });
}

test('each agent card matches its registered tools and keeps identity out of their input', () => {
  expect(existsSync(DOC), `Write the agent cards in ${DOC}.`).toBe(true);
  expect(existsSync(ROOT), `Put the agent instructions in ${ROOT}/<name>/AGENTS.md.`).toBe(true);
  const doc = readFileSync(DOC, 'utf8');
  const agents = readdirSync(ROOT, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory() && existsSync(join(ROOT, entry.name, 'AGENTS.md')));
  expect(agents.length, `No agent directories with AGENTS.md found in ${ROOT}.`).toBeGreaterThan(0);
  for (const { name } of agents) {
    const rows = toolRows(doc, name);
    expect(Object.hasOwn(AGENT_TOOLS, name), `Register ${name} in AGENT_TOOLS, returning [] if it has no app tools.`).toBe(true);
    expect(new Set(rows.map((row) => row.name)).size, `Remove duplicate tool names from ${name}'s agent card.`).toBe(rows.length);
    const tools = AGENT_TOOLS[name]({ id: 'agent-card-test-caller' }, 'agent-card-test');
    const appRows = rows.filter((row) => row.kind !== 'wrapper');
    expect(tools.map((tool) => tool.name).sort(), `Make ${name}'s app tools match the non-wrapper rows in ${DOC}.`).toEqual(appRows.map((row) => row.name).sort());
    const wrapperRows = rows.filter((row) => row.kind === 'wrapper').map((row) => row.name);
    for (const names of configuredTools(name)) {
      expect(names.some((tool) => wrapperRows.includes(tool)), `Add a wrapper row for ${names[0]} to ${name}'s agent card in ${DOC}.`).toBe(true);
    }
    for (const row of rows) {
      expect(kinds, `Use a supported tool kind for ${name}/${row.name}.`).toContain(row.kind);
      expect(row.kind === 'proposes', `Use kind proposes exactly for propose_* tools in ${name}'s agent card (${row.name}).`).toBe(row.name.startsWith('propose_'));
    }
    for (const tool of tools) {
      const schema = z.toJSONSchema(z.object(tool.input), { io: 'input', cycles: 'ref', unrepresentable: 'any' });
      expect(identityFields(schema), `Remove identity fields from ${name}/${tool.name} and close over the caller.`).toEqual([]);
    }
  }
});
