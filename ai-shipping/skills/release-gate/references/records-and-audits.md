# Release records and documentation checks

## The product's records

Use the following meanings even when your product gives the records different names:

| Record | Holds |
|---|---|
| Plan | Phases containing stages, each stage with a done-when, phase preview status and the one current status |
| Backlog | Deferred work, each with its reason and the trigger that reopens it |
| Coverage map | What was verified, by which run (`test-harness`) |
| Integrations doc | Each provider's dashboard configuration, with screenshots |
| Environments doc | Which deployment uses which database, identity instance and keys, plus a dated environment-event log |
| Release history | One dated section per release |

The suggested script names are `gate`, `smoke -- <url>`, `visual` and `agents:live`, shared with `test-harness`. Use your product's names.

## Checks for records maintained during the change

**Use documentation checks without overwriting records maintained during the change.** This restriction applies when docs are written with the change and coverage evidence belongs to whoever ran the gate. In that product, use `ai-shipping` documentation skills only for:

- Document definitions from `shipping-artifacts`.
- The `static-audit` skill's security and performance audits.
- `check` modes of `document-app` and `derive-tests`: they write nothing and list every disagreement among docs, coverage and code.

**For records maintained with changes, decline audit recommendations to rewrite them.** Without `check`, `document-app` and `derive-tests` rewrite docs and coverage from code. `ship-check` also rewrites agent instructions and runs its own review. Decline an audit's recommendation to run them. If the owner explicitly names one, explain what it would overwrite and offer this release path before running it.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/checklist.md` | § 1 every precondition with its reason; § 2 the go/no-go; § 3 the promote commands; § 4 the verify steps (every runtime the push does not build included), the tag and the record, with the release-history format | before any promotion; when posting a go/no-go; after a deploy; deploying a worker, an edge or a box |
| `references/go-live.md` | the first promotion, step by step, and the paid-launch check; the health route and the uptime monitor; guards and hosted CI; rollback, per runtime | making the product live for the first time; checking what is sold or promised; adding a fail-closed guard or hosted CI; rolling back code, schema, a runtime, configuration or a key |
| `references/runbook.md` | any release as one logged checklist: the scripts it calls, the candidate (clean trees, live checks, the review, pins), docs and bookkeeping (staleness, the docs round, the backlog sweep), the backend first, the client release (leak check, the script, artifacts, stores), after the stores (deferred deletions, installations in the field, issues, contributors) | releasing a package, an extension, installers or a store listing; a client and its backend; any release with more than one artifact; writing an operator script |
| `references/netlify.md` | build settings and the adapter; how Netlify's edge handles a request (firewall, WAF, rate limiting, functions); edge-refused Server Actions; the client IP; `after()`; redirects that keep the query; Cloudflare as DNS only | writing or changing an edge rule; reading a client IP; a deploy that behaves differently with no diff; any redirect on Netlify |

Related skills:

- `independent-review` (the review loop)
- `test-harness` (the gate, the harnesses, the coverage map, the script contract)
- `environments` (branches, variables, the migrations window, the tunnel, incidents)
- `supabase-production` (the migration ledger)
- `clerk-production` (the production instance)
- `agent-instructions` (the pass over the agent instructions at each release)
- `app-lifecycle` (where publish and go-live sit on the path)
- `ui-design` (what a screen may claim; what the exploratory pass looks at)
- `shipping-artifacts` (the core docs)
