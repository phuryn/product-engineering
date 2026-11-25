#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseArgs, parseEnv } from 'node:util';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

async function main() {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      model: { type: 'string', default: 'claude-sonnet-5-5' },
      env: { type: 'string', default: '.env' },
      'search-hosts': { type: 'string' },
      help: { type: 'boolean' },
    },
  });
  if (values.help) {
    console.log('Usage: setup-managed.mjs --name <app> [--env .env] [--model <model>] [--search-hosts a.com,b.com]');
    return;
  }
  const name = values.name?.trim();
  if (!name || !values.model.trim()) throw new Error('Supply --name <app> and a nonempty model.');
  // From the file and never the shell: an exported key would create these in another workspace.
  const env = parseEnv(readFileSync(values.env, 'utf8'));
  if (!env.ANTHROPIC_API_KEY) throw new Error(`Set ANTHROPIC_API_KEY in ${values.env}.`);
  const hosts = values['search-hosts']?.split(',').map((host) => host.trim().toLowerCase());
  const hostname = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  if (hosts?.some((host) => host.length > 253 || !hostname.test(host))) {
    throw new Error('--search-hosts takes comma-separated bare host names such as example.org.');
  }

  if (hosts && env.CLAUDE_SEARCH_ENVIRONMENT_ID) throw new Error(`${values.env} already has CLAUDE_SEARCH_ENVIRONMENT_ID. Change its hosts in the Console.`);
  if (!hosts && env.CLAUDE_AGENT_ID && env.CLAUDE_ENVIRONMENT_ID) throw new Error(`Nothing to create: ${values.env} has its IDs.`);

  const Anthropic = createRequire(resolve('package.json'))('@anthropic-ai/sdk').default;
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY, authToken: null, baseURL: 'https://api.anthropic.com', maxRetries: 0, logLevel: 'off',
  });
  const environment = (suffix, allowed_hosts) => client.beta.environments.create({
    name: `${name} ${suffix}`,
    config: {
      type: 'cloud',
      networking: { type: 'limited', allowed_hosts, allow_mcp_servers: false, allow_package_managers: false },
    },
  });

  let stage = 'base agent';
  try {
    if (!env.CLAUDE_AGENT_ID) {
      const agent = await client.beta.agents.create({
        name,
        model: { id: values.model, effort: 'medium' },
        system: 'Use the instructions and tools supplied when each session starts.',
        tools: [],
      });
      console.log(`CLAUDE_AGENT_ID=${agent.id}`);
    }
    if (!env.CLAUDE_ENVIRONMENT_ID) {
      stage = 'main environment';
      const main = await environment('local tools', []);
      console.log(`CLAUDE_ENVIRONMENT_ID=${main.id}`);
    }
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
