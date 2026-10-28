---
name: test-harness
description: "Writing or running tests, proving a fix, a red or flaky run, a fix that didn't land, 'is it verified', 'run the gate': tests where green means something."
---

# Test harness — so a green gate means something

A suite that passes against the wrong server, the wrong database, a fixture on the wrong branch or a developer's `.env` reports green and proves nothing. This skill is how the harnesses are arranged so that each one makes something real, how the gate is run and reported, and the rules — each from a bug, with its receipt — that keep a green run honest.

The rules come from two kinds of product, named here only by kind. **Most** were learned on web apps built on Next.js (App Router), Supabase Postgres and Clerk, tested with Vitest and Playwright (a live Q&A product, a monitoring product and others). **The two-halves harnesses and several rules from bugs** — marked *the remote-control product* where they appear — were learned on a relay service with a web client and an editor extension with desktop installers that drives a CLI agent. Each states its principle first and the mechanism second: on another stack, keep the principle and swap the mechanism. **The product's own instructions come first** — where they name its scripts, folders or coverage file, follow them.

## The one question: what does each harness fake?

**A bug survives exactly where every harness fakes the same side.** Coverage of surfaces is not coverage of journeys. Before adding a suite, write down what it makes real; if everything else already fakes the same side, it mostly re-covers ground.

| Harness | Makes real | Fakes | Runs |
|---|---|---|---|
| Unit | pure modules: authorization functions, schemas, token hashing, limits, escaping, the env schema, source guards, the edge-rule numbers | database, identity, browser | gate |
| Integration | the development Postgres: the applied schema, deny-all, cross-tenant, invariants and races through the real SQL functions | identity (a mock verifier behind the same seam as the real one) | gate |
| Schema catalog | every public relation and function, enumerated from the catalog so future objects are covered | identity, fixtures | gate |
| Browser, public | a real browser on a phone profile against the development database; the anonymous journey needs no account | member identity | gate |
| Browser, authenticated | the identity provider's real development instance and real sessions, an account per role | mail | **local** gate |
| Visual | a bounded release set of captures; on request, a full sweep | identity where a capture does not sign in | outside the gate, on purpose |
| Live agents (only with embedded agents) | the real model with each agent's tools | — | outside the gate: it costs money |
| Smoke | a deployed URL, write-free | — | after every deploy, **last** |

**When the product has two halves** — a backend and a client, a host and the vendor tool it drives — ask the question per half: a defect that needs both real halves, or a restart in the middle of a journey, is invisible when every suite fakes the other side. Build one harness with both halves real that can kill a process mid-journey, and a compatibility suite that holds an old client working against the new backend.

Every row in full — what each makes real, how it reaches its target, why it runs where it runs — the two-halves harnesses, the browser configs, the script contract and the authenticated mile: `references/harnesses.md`.

## The gate

`gate` runs `typecheck`, `test` (unit + integration), `e2e` and `e2e:auth`, in that order, **locally, mandatory before any promotion**. `visual`, the live agent suite and `smoke -- <url>` run outside it on purpose. There is no hosted CI unless it was wired as its own change (`release-gate`); if it is, it runs the gate minus the authenticated mile, and that gap is covered by the local gate, never by a silent skip.

## Tests and docs are part of the change, not a later step

- **A bug fix lands with a regression test that fails on the broken behaviour and passes with the fix — and the failing half is run, not assumed.** Run the new test on the tree before the fix (the parent commit, or the fix reverted). If it passes there, the bug was not what the finding said: revert the fix and keep the assertion. A review finding's fix is proven the same way. (`2026-10-23`, a monitoring product: a review round's fix came with a journey check that passed on the commit before it; the fix was reverted and the assertion kept.)
- **Any other behaviour change lands with the tests it owes** (below and in the references), and a new test goes in the harness whose **Runs** column says where it runs — in the gate, outside it, or by hand. **Say which in the summary.**
- **Every change updates the doc lines it made false.** A doc you find disagreeing with code you did not change: say so in the summary and let the owner decide which side moves. When the instructions are silent, decide and say so in the summary. When a library default conflicts with the product's instructions, the instructions win.

## When a fix doesn't land

**After two fixes that pass their checks and leave the reported symptom unchanged, stop fixing.** Green tests that leave the symptom in place mean the model of the problem is wrong, not the code: they exercise a sequence the person never meets. Write down the explanations still standing, then get **one observation whose outcome tells them apart**: a screenshot, a log line from their run, a question the person can answer in a minute. Ask for it after the second fix that didn't land, not the fifth. (`2026-08-21`, a remote-control product: four rounds, each correct and green, none fixing what the owner saw.)

- **First check that the person is running your build.** A fix tested against yesterday's install fails twice for no reason in the code (`2026-08-19`: the owner tested a fix twice against the previous night's build).
- **Reproduce the original symptom before the next fix**, in a test or by hand, and keep that reproduction: it is the regression test the fix lands with.

How you can tell it worked: the fix that lands comes with a test that reproduced the symptom before it, and the person confirms the symptom is gone in their own run.

## Required for every feature that touches data

- **Cross-tenant:** a member of workspace A, with B's ids, can neither see nor act.
- **The invariant:** the once-only action refused the second time; the quota held under a race.
- **The sanitizer:** a script tag renders as text.
- **Idempotency:** runs twice, acts once.
- **Token scope:** a token does only what it was scoped to.

What each of these protects, and why invariants live in the database rather than the code, is the `saas-authorization` skill.

## Reporting a run

- **Read every exit code from the log, never the notification.** A background wrapper can report exit 0 while the command inside it failed. (`2026-09-17`, a visual sweep's log ended `VISUAL_EXIT=1` under an exit-0 notification.)
- **The gate is the exit code, never the printed counts.** A run can print every test passed and exit 1 on one unhandled rejection; a report that quotes counts without the exit code has established nothing (`2026-09-23`, `references/rules-from-bugs.md § Reading a red run`).
- **An inherited report is a claim, not evidence.** Re-run the gate yourself before repeating a count. (`2026-09-16`, a verified-sounding handoff missed unapplied production migrations.)
- **The coverage map is written by whoever ran the gate, and by nobody else.** A delegated builder whose sandbox cannot reach Postgres or a browser has no passing gate to report; read every line it adds and rewrite the evidence from your own run, never by editing its numbers. (`2026-09-16` and `2026-09-17`, blocked builder runs were reported in the coordinator's name with invented counts.) The map's format: `references/coverage-map.md`.
- **A green run that flakes is not a pass.** Judge a suite on a series. A red run followed by a green one is recorded as both. A flake goes in the backlog the first time it appears; the second time, its fix is due (`references/rules-from-bugs.md § Reading a red run`). A suite that has never been green reports nothing and hides the next real red.
- **A failure whose duration equals the budget is a hang until shown otherwise.** Read the trace, the network and the whole log body before the failure list (`references/rules-from-bugs.md § Reading a red run`).

## The rules most often missed

Each has its receipt in the references; these are the ones that cost the most when skipped.

- **A fallback in a test is a bug in disguise.** "Try the new way, else the old way" passes exactly when the thing under test is absent. Assert the one true path.
- **A pin must not pass against a dead branch.** A substring assertion is satisfied by `if (false && …)`; assert the whole conditional and watch it fail under that mutation.
- **A new precondition breaks the harnesses CI does not run.** When a change adds something a person must do before the product starts, every harness that launches a real instance must seed it — and run the suites outside CI before the release, not inside it.
- **Test sign-in the way a new user meets it**, with no saved credential on the machine; a signed-in machine passes a broken sign-in.
- **A reused server can be a build from before your change.** The browser suites never reuse a server already on the port; when an assertion disagrees with source you just edited, check what answers the port before changing code.
- **The developer's `.env` is a harness default.** Pin every optional configuration a suite's meaning depends on in the shared server module, or one assertion means different things on different machines.
- **A DOM assertion cannot see a layout.** Claims about layout need geometry, and a person looks at the captures.
- **Nothing else touches the gate's data while it runs.** The browser suites run one at a time — they share a server and test accounts, and each resets what those accounts own — and the same holds for every other actor on the development environment: a parallel agent session driving a test account, a background worker acting on the suites' fixtures (`references/rules-from-bugs.md § The harness's environment`).
- **Never test against production data or with production credentials.** Development instance, development project, dedicated test accounts. Only the smoke touches production, and it writes nothing.
- **A generated file can arrive rewritten by the tooling that wrote it.** A backtick inside `git commit -m "…"` is command substitution: the shell runs the word and replaces it with its output, usually nothing, and the text vanishes silently — a commit landed reading "Grok sends , so". Commit messages go through a heredoc (`git commit -F -`). A test written through a shell into an interpreter is rewritten the same way: generate through the fewest layers (the agent's file-write tool), and read the bytes produced (`references/rules-from-bugs.md § Generated files`).
- **A suite outside the gate rots silently.** A screen's captures are part of its surface: update its visual specs in the same stage, and run the visual suite after every stage that changes a screen.

## How you can tell it worked

The gate was run by you, its result read from the exit code, each new test sits in the harness whose Runs column says where it runs, and the coverage map was updated from that run.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/harnesses.md` | every harness in full; harnesses for a product with two halves (both real, old-client compatibility, the wire between DOM suites, operator checks, the authenticated canary); the two browser configs and the shared server module; the script contract; the authenticated mile | adding a suite or a script; a client and its backend; setting up or debugging the authenticated browser suite |
| `references/rules-from-bugs.md` | the gate and harness rules, grouped by moment: reading a red run (the exit code, flakes, hangs, rotted checks); writing assertions; fixtures; the database; servers, builds and worktrees; browsers and layout; the harness's environment (preconditions, sign-in without a credential); same-origin checks; generated files | writing or running any test; a red, flaky or hanging run; creating or removing a worktree |
| `references/captures.md` | the capture harness and the exploratory pass: the release set as a budget, where captures live, sweeps | after a stage that changes a screen; before a release's visual pass |
| `references/vendor-surfaces.md` | vendor-rendered elements measured from the DOM; link previews asserted on the raw response; icons and generated images | testing a third-party component, a share card, an icon or an OG image |
| `references/coverage-map.md` | the coverage map's sections and who writes it | after a gate run; at a release; when a stage adds tests |

**Not here:** what a screen may claim and what to verify visually (widths, states, themes, roles, the 320 px floor) are the `design` skill's `references/screens.md`. The coverage map as a *document* — what it must contain for a reviewer — is `shipping-artifacts`, and the `derive-tests` skill derives one from the docs (its `check` mode lists where it is stale and writes nothing). The release checklist is `release-gate`. The identity provider's harness mechanics in depth are `clerk-production`; the database's catalog posture and error codes are `supabase-production`.

**The folders and scripts named here are a suggested layout:** `tests/unit/`, `tests/integration/`, `tests/e2e/` (`*.auth.spec.ts` for the authenticated suite), `tests/visual/`, `tests/live/`, `tests/smoke/`, and the scripts `typecheck`, `test`, `e2e`, `e2e:auth`, `gate`, `visual`, `agents:live`, `smoke` (`references/harnesses.md § The script contract`). Call yours what you like. The **coverage map** is the product's record of what was verified, by which run (`references/coverage-map.md`); the **variables doc** lists every environment variable the code reads; the **kit** is the product's design system and component primitives (`design`).
