---
name: start-here
description: "Where to start, and what comes next, along the product lifecycle: from a new idea, new evidence, an agreed change, a bug or a release to the next step and the skill that does it. Started by name only: /product:start-here in Claude Code, $product:start-here in Codex."
argument-hint: "<what you have: an idea, a change, a bug, a release; or nothing, to find out where you are>"
disable-model-invocation: true
---

# Start here — the next step, along the product's lifecycle

A product goes from an idea to paying users and round again. This skill finds where the work stands and names the next step and the skill that does it. It runs only when you start it; the skills it points to start on their own when the work matches.

## Invocation

```
/product:start-here                              Claude Code, plugin installed
/product:start-here I have an idea for a tool for tutors
$product:start-here we have a bug in sign-in      Codex, plugin installed
/start-here   ·   $start-here                     the skill folder copied into a repository
```

## Find what you have

Read what came with the request, then the repository: its agent instructions, its product docs, its plan's status, `git status` and the recent commits. A status that disagrees with the code is a claim; the code wins. Fetch first: a checkout behind its remote describes the past. List what the remote has that the checkout lacks: `git log --oneline 'HEAD..@{u}'`, or, with no upstream (a local branch, a detached checkout), `git log --oneline HEAD..origin/HEAD` (`git remote set-head origin --auto` sets it when it is missing). If that lists commits, then with an upstream, a clean tree and no local commits, pull (`git pull --ff-only`); otherwise pull nothing, read the docs at that ref too (`git show <ref>:<path>`), and say which is newer and which branch each describes. Only a repository with no remote has nothing newer. (`2026-10-28`, a session read a product's docs from a checkout six days behind and reported its DNS provider as not set up, days after it had been.)

| You have | The next step | Where the how lives |
|---|---|---|
| **A new idea** | research it and propose, the interface first | the `propose` skill |
| **A product in use, and new evidence** (usage, payments, interviews, support) | propose again, with what people did | the `propose` skill, § Running it again |
| **An agreed change, small** (you can say it in a sentence and check it in a minute) | build it and verify it; no proposal, no plan | the `test-harness` skill |
| **An agreed change, complex** | a plan first, with the plan prompt below; then build | below; then the `delegation` skill if another agent builds it |
| **A bug** | reproduce it, fix it with a test that failed before the fix; after two fixes that pass and leave the symptom, stop and get one observation | the `test-harness` skill, § When a fix doesn't land |
| **A release** | the gate, the owner's preview, the independent review, promote, prove it serves | the `release-gate` and `grok-agents` skills |
| **The end of a session** | hand over, or turn its friction into a setup fix | type `/agent-harness:handover` or `/agent-harness:retro` (Codex: `$agent-harness:handover`, `$agent-harness:retro`) |
| **Nothing yet, an empty repository** | the same as a new idea | the `propose` skill |

**Small fixes go straight to the build and its verification.** The steps below are for work that has them; a one-line copy change that walks through a proposal and a plan is ceremony, and ceremony teaches everyone to skip the steps that matter.

## The lifecycle

1. **Start.** You say what you have; this skill reads it and the repository, finds where the work stands, and names the next step (the table above).
2. **Proposal.** The agent reads what you shared, researches what's missing (alternatives, the market, what people say) and proposes informed hypotheses with their sources, in something you review: the interface first, often an interactive prototype on sample data. It asks only what the evidence can't decide. When it helps, the accepted intent and use cases go in a short file, skipped for a small change. *The `propose` skill; for a SaaS, the brief in the `app-lifecycle` skill.*
3. **Plan, for a complex change only.** The agent writes it; you review it without going deep. Ask for it with this prompt, every time:

   ```
   <the change, in your words>. Create a plan. Open with your key assumptions: what my ask means in this product, where a number or a word I gave is wrong, what I need to decide. Then what to implement, how to test it (a test that would touch production, its users or its data runs only with my go), acceptance criteria.
   ```

   The models plan well when asked; what gets skipped is the ask. The prompt has the agent open the plan with its key assumptions, and those are what you review: what the ask means in this product, where a number or a word you gave is wrong, and what needs a person to decide, moved up from the end, where the model plan has it (`app-lifecycle`, `references/capabilities.md` § What a proposal looks like). The rest of the plan is for the agents that build it, and the prompt names the least it holds, not all it may: phases and releases, the files and modules each phase changes, whatever the build needs. The agent may ask questions first, and may show the plan as a page (in Claude, an artifact), which is easier to review than terminal text. The page is a view: the plan itself goes into the repository, where the next session reads it (§ Sessions). The testing is the agents', with one limit: **a test that would touch production, its users or its data runs only with your go**, so the plan names it and the agent asks before it runs. (`2026-09-14`, a live Q&A product: asked for a per-IP rate limit, the plan's test section said the host's limits exist only on the host and couldn't be tested locally. The owner ran the plan with a test there, last: it sent requests from the tester's own address until the host refused one with HTTP 429, which blocks only that address for a minute, then checked that pages still loaded. Both limits were confirmed that way.)
4. **Build.** One session coordinates; another builds when one is available; a third reviews. Tests and doc lines land with the change. *The `delegation`, `codex-agents` and `test-harness` skills.*
5. **Click-through.** At the end of every change that alters what a person sees, you click through the common flows yourself: a link and 3 to 7 things to try, each an action and what should happen. Fifteen to twenty minutes for a mid-size app, every time. Agents taking screenshots miss what moves and what is visible only for a moment. (`2026-10-22`, a monitoring product: ten minutes of its owner using a preview found six problems no review had.) *The `release-gate` skill, § The owner's preview.*
6. **Reviews.** Three questions, in this order:
   - **Are the docs right?** Where the strategy, segments, roles, flows, rules and integrations are written, and whether they match the code. Check mode reports, it doesn't rewrite: when a doc and the code disagree about what the product should do, that is your decision, and a doc rewritten to match faulty code blesses the bug. *The `document-app` skill in `check` mode, or the `shipping-artifacts` skill for what each doc holds.*
   - **Are the tests right?** What is missing, and whether each test would fail if the behaviour broke. A coverage map shows what is tested, not whether the tests are any good. *The `derive-tests` skill in `check` mode, which reports and writes nothing. Where a test, the coverage map and a doc disagree, you decide which one moves; the change then lands with its tests (the `test-harness` skill).*
   - **Is the code right?** Correctness, then security and performance, findings by priority. *The `code-review` skill; the `security-audit-static` and `performance-audit-static` skills at a release; then a fresh reviewer that never saw the build, the `grok-agents` skill.* For an app built without docs, type `/ai-shipping:ship-check` (Codex: `$ai-shipping:ship-check`): all of it in one long pass, writing as it goes (the docs from the code, the agent instructions, the coverage map). Where docs already say what the product should do, or whoever runs the gate keeps the coverage map, it lists what it would overwrite and asks first.
7. **Release.** *The `release-gate` skill*, and for a SaaS, the go-live stage of the `app-lifecycle` skill. Watch it in production: *the `uptime-monitoring` skill.*
8. **Real users, then the next round.** What they did, returned to, abandoned and paid for goes back into step 1. *The `propose` skill, § Running it again.*

For a SaaS on Next.js, Supabase and Clerk, the `app-lifecycle` skill is the same path in detail, stage by stage, each with its done-when.

## Sessions

- **A new stage or a new area starts a fresh session.** What it needs belongs in the repository's docs and the stage's plan, not in an old conversation.
- **Hand over before the context runs out, or when the work continues tomorrow**: type `/agent-harness:handover`. For work that runs for hours or waits on decisions, the `flight-deck` skill keeps a status board across sessions.
- **When the same friction came up twice in a session**, type `/agent-harness:retro` before closing it.

## Commands by agent

| | Claude Code | Codex | A folder copied into the repository |
|---|---|---|---|
| A skill you start | `/<pack>:<skill>` | `$<pack>:<skill>` | `/<skill>` · `$<skill>` |
| A skill that starts itself | say what you want; or name it the same way | the same | the same |

The skills you start: `start-here`, `ship-check`, `handover`, `retro`. The rest start themselves when the work matches their description.

## How you can tell it worked

You know the next step, which skill does it, and what you will be asked to check; and nothing was proposed or planned for a change you could have checked in a minute.
