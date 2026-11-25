#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

async function main() {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      model: { type: 'string', default: 'claude-sonnet-5-5' },
      'search-hosts': { type: 'string' },
      again: { type: 'boolean' },
      help: { type: 'boolean' },
    },
  });
  if (values.help) {
    console.log('Usage: setup-managed.mjs --name <app> [--model <model>] [--search-hosts a.com,b.com] [--again]');
    return;
  }
  const name = values.name?.trim();
  if (!name || !values.model.trim()) throw new Error('Supply --name <app> and a nonempty model.');
  const ids = ['CLAUDE_AGENT_ID', 'CLAUDE_ENVIRONMENT_ID', 'CLAUDE_SEARCH_ENVIRONMENT_ID'];
  if (!values.again && ids.some((id) => process.env[id])) {
    throw new Error('A Managed Agents ID is already set. Use --again only to create a separate set of resources.');
  }
  const hosts = values['search-hosts']?.split(',').map((host) => host.trim().toLowerCase());
  const hostname = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  if (hosts?.some((host) => host.length > 253 || !hostname.test(host))) {
    throw new Error('--search-hosts takes comma-separated bare host names such as example.org.');
  }

  const Anthropic = createRequire(resolve('package.json'))('@anthropic-ai/sdk').default;
  const client = new Anthropic({ maxRetries: 0, logLevel: 'off' });
  const environment = (suffix, allowed_hosts) => client.beta.environments.create({
    name: `${name} ${suffix}`,
    config: {
      type: 'cloud',
      networking: { type: 'limited', allowed_hosts, allow_mcp_servers: false, allow_package_managers: false },
    },
  });

  let stage = 'base agent';
  try {
    const agent = await client.beta.agents.create({
      name,
      model: { id: values.model, effort: 'medium' },
      system: 'Use the instructions and tools supplied when each session starts.',
      tools: [],
    });
    console.log(`CLAUDE_AGENT_ID=${agent.id}`);
    stage = 'main environment';
    const main = await environment('local tools', []);
    console.log(`CLAUDE_ENVIRONMENT_ID=${main.id}`);
    if (hosts) {
      stage = 'search environment';
      const search = await environment('search', [...new Set(hosts)]);
      console.log(`CLAUDE_SEARCH_ENVIRONMENT_ID=${search.id}`);
    }
  } catch (error) {
    const status = error instanceof Anthropic.APIError && error.status ? ` (HTTP ${error.status})` : '';
    throw new Error(`Could not create the ${stage}${status}. Check the Console workspace and save any IDs printed above before retrying.`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
