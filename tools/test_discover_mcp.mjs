// The MCP discovery scripts load their SDK from the app, not from the skill's folder: run from a
// plugin install, the folder has no node_modules. Stub packages keep it offline. Run by tools/validate.py.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { closeSync, copyFileSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const runtimes = [
  ['agent-sdk', '@anthropic-ai/claude-agent-sdk', { '.': 'query' }],
  ['messages-api', '@modelcontextprotocol/sdk', {
    './client/index.js': 'Client',
    './client/stdio.js': 'StdioClientTransport',
    './client/streamableHttp.js': 'StreamableHTTPClientTransport',
  }],
];

for (const [runtime, packageName, entryPoints] of runtimes) {
  test(`${runtime} discovery resolves dependencies from the app`, async (t) => {
    const root = mkdtempSync(join(tmpdir(), 'mcp-discovery-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const app = join(root, 'app');
    const plugin = join(root, 'plugin');
    mkdirSync(app);
    mkdirSync(plugin);
    writeFileSync(join(app, 'package.json'), '{}');
    const name = `discover-mcp-tools-${runtime}.mjs`;
    const script = join(plugin, name);
    copyFileSync(new URL(`../app-stack/skills/embedded-agents/scripts/${name}`, import.meta.url), script);
    const run = () => {
      const log = join(root, 'output.txt');
      const fd = openSync(log, 'w');
      try {
        const { status, error } = spawnSync(process.execPath, [script, 'no-mcp'], { cwd: app, stdio: ['ignore', fd, fd] });
        assert.ifError(error);
        return { status, output: readFileSync(log, 'utf8').trim() };
      } finally {
        closeSync(fd);
      }
    };

    await t.test('names the missing package and exits with code 2', () => {
      const result = run();
      assert.equal(result.status, 2, result.output);
      assert.ok(result.output.includes(`npm install ${packageName}`), result.output);
    });

    const dependency = join(app, 'node_modules', packageName);
    mkdirSync(dependency, { recursive: true });
    const exports = Object.fromEntries(Object.entries(entryPoints).map(([entry, binding]) => {
      writeFileSync(join(dependency, `${binding}.mjs`), `export function ${binding}() {}`);
      return [entry, `./${binding}.mjs`];
    }));
    writeFileSync(join(dependency, 'package.json'), JSON.stringify({ exports }));

    await t.test('loads the app dependency from outside the app', () => {
      const result = run();
      assert.equal(result.status, 0, result.output);
      assert.equal(result.output, 'no-mcp has no .mcp.json: nothing to discover.');
    });
  });
}
