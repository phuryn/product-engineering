---
name: test-harness
description: "Writing or running tests, proving a fix, a red or flaky run, a fix that didn't land, 'is it verified', 'run the gate': tests where green means something."
---


# Test harness — so a green gate means something

**Make each harness prove something real before trusting its green result.** A suite can pass against the wrong server, database, fixture branch, or developer's `.env` and prove nothing. This skill arranges the harnesses, defines gate runs and reporting, and keeps green runs honest with rules learned from bugs.

**On another stack, keep the principle and swap the mechanism.** Each rule states its principle first and the mechanism second. The web-app mechanisms use Next.js (App Router), Supabase Postgres, Clerk, Vitest, and Playwright. The two-halves mechanisms were learned on a relay service with a web client and an editor extension with desktop installers that drives a CLI agent.

**The product's own instructions come first** — where they name its scripts, folders, or coverage file, follow them.

## The one question: what does each harness fake?

**A bug survives exactly where every harness fakes the same side.** Coverage of surfaces is not coverage of journeys. Before adding a suite, write down what it makes real. If everything else already fakes the same side, it mostly re-covers ground.

| Harness | Makes real | Fakes | Runs |
|---|---|---|---|
| Unit | pure modules: authorization functions, schemas, token hashing, limits, escaping, the env schema, source guards, the edge-rule numbers | database, identity, browser | gate |
| Integration | the development Postgres: the applied schema, deny-all, cross-tenant, invariants and races through the real SQL functions | identity (a mock verifier behind the same seam as the real one) | gate |
| Schema catalog | every public relation and function, enumerated from the catalog so future objects are covered | identity, fixtures | gate |
| Browser, public | a real browser on a phone profile against the development database; the anonymous journey needs no account | member identity | gate |
| Browser, authenticated | the identity provider's real development instance and real sessions, an account per role | mail | local gate |
| Visual | a bounded release set of captures; on request, a full sweep | identity where a capture does not sign in | outside the gate, on purpose |
| Live agents (only with embedded agents) | the real model with each agent's tools | — | outside the gate: it costs money |
| Smoke | a deployed URL, write-free | — | after every deploy, last |

**When a product has two halves, ask what is faked per half.** This includes a backend and client, or a host and the vendor tool it drives. Defects needing both real halves, or a restart mid-journey, are invisible when every suite fakes the other side. Build one harness with both halves real that can kill a process mid-journey. Add a compatibility suite that holds an old client working against the new backend.

Every row in full, including its target and run placement, is in `references/harnesses.md`. That reference also covers the two-halves harnesses, browser configs, script contract, and authenticated mile.

## The gate

**Run the local gate in order before every promotion.** `gate` runs `typecheck`, `test` (unit + integration), `e2e`, then `e2e:auth`, locally and mandatorily before any promotion. `visual`, the live agent suite, and `smoke -- <url>` run outside it on purpose. There is no hosted CI unless wired as its own change (`release-gate`). If wired, it runs the gate minus the authenticated mile. The local gate covers that gap; never silently skip it.

## Tests and docs are part of the change, not a later step

- **Budget integration tests in round trips to the real database.** Include fixture setup and cleanup at the target's measured latency. A test needing more than 30 seconds states why and sets its own limit; don't raise the whole suite's timeout. When the builder cannot reach the database or launch the browser, budget one integration-fix pass by the session agent after its first real run. Put that budget in both the brief and stage plan.
- **A bug fix lands with a regression test run against broken behaviour.** It must fail on the broken behaviour and pass with the fix; run the failing half, don't assume it. Run the new test on the tree before the fix: the parent commit, or the fix reverted. If it passes there, the bug was not what the finding said: revert the fix and keep the assertion. Prove a review finding's fix the same way.
- **Any other behaviour change lands with the tests it owes** (below and in the references). Put each new test in the harness whose Runs column says where it runs: in the gate, outside it, or by hand. **Say which in the summary.**
- **Every change updates the doc lines it made false.** If a doc disagrees with code you did not change, say so in the summary and let the owner decide which side moves. When instructions are silent, the skills' defaults apply. When those are silent too, decide and say so in the summary. When a library default conflicts with the product's instructions, the instructions win.

## When a fix doesn't land

**After two fixes that pass their checks and leave the reported symptom unchanged, stop fixing.** Green checks with an unchanged symptom mean the model of the problem is wrong: the tests exercise a sequence the person never meets. Write down the explanations still standing. Get one observation whose outcome tells them apart: a screenshot, a log line from their run, or a question answerable in a minute. Ask after the second fix that didn't land, not the fifth.

- **First check that the person is running your build.** A fix tested against yesterday's install fails twice for no reason in the code.
- **Reproduce the original symptom before the next fix**, in a test or by hand, and keep that reproduction. It is the regression test the fix lands with.

The fix that lands comes with a test that reproduced the symptom before it, and the person confirms the symptom is gone in their own run.

## Required for every feature that touches data

**Every feature that touches data gets the required boundary and integrity tests.** These checks establish:

- **A workspace A member cannot see or act with workspace B's ids.**
- **Refuse a once-only action's second attempt; hold the quota under a race.**
- **A script tag renders as text.**
- **Idempotent work runs twice and acts once.**
- **A token does only what it was scoped to.**
- **Every page renders once:** A page-level smoke in the browser suites opens each page as each role, with a foreign workspace's id, and signed out. Assert it renders, refuses, or sends to sign-in as its permission row says, never an error page. Per-route tests prove refusals; only this proves every page renders.
- **Every new database function runs end to end once**, in the integration suite against the applied schema, with the rows it will meet. A migration applying and a catalog check passing prove nothing about a body plpgsql checks only when run (`supabase-production`, `references/gotchas.md`).
- **Test deletion of a fully populated workspace as one test.** Put a row in every table a member can fill, then delete the workspace. The deletion completes and leaves none.

The `saas-authorization` skill explains what each protects and why invariants live in the database rather than code.

## Reporting a run

- **Read every exit code from the log, never the notification.** A background wrapper can report exit 0 while the command inside it failed.
- **The gate is the exit code, never the printed counts.** A run can print every test passed and exit 1 on an unhandled rejection. Counts without the exit code establish nothing (`references/rules-from-bugs.md § Reading a red run`).
- **An inherited report is a claim, not evidence.** Re-run the gate yourself before repeating a count.
- **The coverage map is written by whoever ran the gate, and by nobody else.** A delegated builder whose sandbox cannot reach Postgres or a browser has no passing gate to report. Read every line it adds and rewrite the evidence from your own run, never by editing its numbers. Use `references/coverage-map.md` for the map's format.
- **A green run that flakes is not a pass.** Judge a suite on a series. Record both a red run and the green one after it. A flake goes in the backlog on its first appearance; its second makes the fix due (`references/rules-from-bugs.md § Reading a red run`). A suite that has never been green reports nothing and hides the next real red.
- **A failure whose duration equals the budget is a hang until shown otherwise.** Read the trace, network, and whole log body before the failure list (`references/rules-from-bugs.md § Reading a red run`).

## The rules most often missed

Each of these rules has its receipt in the references. They are the ones that cost the most when skipped.

- **A fallback in a test is a bug in disguise.** "Try the new way, else the old way" passes exactly when the thing under test is absent. Assert the one true path.
- **A pin must not pass against a dead branch.** A substring assertion is satisfied by `if (false && …)`. Assert the whole conditional and watch it fail under that mutation.
- **A new precondition breaks the harnesses CI does not run.** If a change adds something a person must do before the product starts, every harness launching a real instance must seed it. Run the suites outside CI before the release, not inside it.
- **Test sign-in the way a new user meets it**, with no saved credential on the machine; a signed-in machine passes a broken sign-in.
- **A reused server can be a build from before your change.** The browser suites never reuse a server already on the port. When an assertion disagrees with source you just edited, check what answers the port before changing code.
- **The developer's `.env` is a harness default.** Pin every optional configuration a suite's meaning depends on in the shared server module. Otherwise, one assertion means different things on different machines.
- **A DOM assertion cannot see a layout.** Claims about layout need geometry, and a person looks at the captures.
- **Nothing else touches the gate's data while it runs.** Run browser suites one at a time: they share a server and test accounts, and each resets what those accounts own. The same holds for every other actor on development. That includes a parallel agent driving a test account and a background worker acting on the suites' fixtures (`references/rules-from-bugs.md § The harness's environment`).

  **A deployed worker never stops**. Before the first deploy running one against development's database, scope it away from test-account workspaces or give the suites their own database. That can be a test project or the local stack. Until then, let suites' setup fail loudly when anything outside them has claimed one of their fixtures.
- **Never test against production data or with production credentials.** Use the development instance, development project, and dedicated test accounts. Only the smoke touches production, and it writes nothing.
- **A generated file can arrive rewritten by the tooling that wrote it.** A backtick inside `git commit -m "…"` is command substitution: the shell runs the word and replaces it with its output, usually nothing. The text vanishes silently. Commit messages go through a heredoc (`git commit -F -`). A test written through a shell into an interpreter is rewritten the same way. Generate through the fewest layers, using the agent's file-write tool, and read the bytes produced (`references/rules-from-bugs.md § Generated files`).
- **A suite outside the gate rots silently.** A screen's captures are part of its surface. Update visual specs in the same stage, and run the visual suite after every stage that changes a screen.

Each rule's origin, the case that taught it, is in `receipts.md` beside this file; read it when a rule's edge is unclear.

## How you can tell it worked

You ran the gate and read its exit code; each new test sits in the harness whose Runs column says where it runs. The coverage map was updated from that run.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/harnesses.md` | every harness in full; harnesses for a product with two halves (both real, old-client compatibility, the wire between DOM suites, operator checks, the authenticated canary); the two browser configs and the shared server module; the script contract; the authenticated mile | adding a suite or a script; a client and its backend; setting up or debugging the authenticated browser suite |
| `references/rules-from-bugs.md` | the gate and harness rules, grouped by moment: reading a red run (the exit code, flakes, hangs, rotted checks); writing assertions; fixtures; the database; servers, builds and worktrees; browsers and layout; the harness's environment (preconditions, sign-in without a credential); same-origin checks; generated files | writing or running any test; a red, flaky or hanging run; creating or removing a worktree |
| `references/captures.md` | the capture harness and the exploratory pass: the release set as a budget, where captures live, sweeps | after a stage that changes a screen; before a release's visual pass |
| `references/vendor-surfaces.md` | vendor-rendered elements measured from the DOM; link previews asserted on the raw response; icons and generated images | testing a third-party component, a share card, an icon or an OG image |
| `references/coverage-map.md` | the coverage map's sections and who writes it | after a gate run; at a release; when a stage adds tests |

**Use the related skills for screen claims, coverage documents, and release mechanics.** What a screen may claim and what to verify visually are outside this skill: widths, states, themes, roles, and the 320 px floor. Use the `ui-design` skill's `references/screens.md`. The coverage map as a document, including its required reviewer contents, is `shipping-artifacts`. The `derive-tests` skill derives one from docs; its `check` mode lists stale entries and writes nothing. Use `release-gate` for the release checklist. The identity provider's harness mechanics in depth are `clerk-production`; the database's catalog posture and error codes are `supabase-production`.

**The folders and scripts named here are a suggested layout:** Call yours what you like:

- `tests/unit/`, `tests/integration/`, `tests/e2e/` (`*.auth.spec.ts` for the authenticated suite), `tests/visual/`, `tests/live/`, `tests/smoke/`;
- `typecheck`, `test`, `e2e`, `e2e:auth`, `gate`, `visual`, `agents:live`, `smoke` (`references/harnesses.md § The script contract`).

The coverage map is the product's record of what was verified, by which run (`references/coverage-map.md`). The variables doc lists every environment variable the code reads. The kit is the product's design system and component primitives (`ui-design`).
