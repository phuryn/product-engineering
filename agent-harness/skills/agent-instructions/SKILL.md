---
name: agent-instructions
description: "Writing or restructuring AGENTS.md or CLAUDE.md, adding a rule ('remember this'), or after an agent ignored a rule it had: make each rule get met when it applies."
---

# Agent instructions — rules met at the moment they apply

The instruction file is the context an agent carries into every session: `AGENTS.md`, `CLAUDE.md`, or both. Below it is called **the entry file**, because it is where every session enters and what routes the rest. This skill is how to write one for an app repository and keep it working as the product grows. It was learned on SaaS repositories built with coding agents on Next.js + Supabase + Clerk + Netlify — a starter repository and the products built from it — and on a content repository run day to day by agents, whose instructions had grown to hundreds of thousands of words of doctrine. The method is stack-independent; the examples are from those repositories, named by kind.

**A rule written down is not yet a rule an agent follows: it must be met at the moment it applies.** Everything below follows from that sentence:

1. **The entry file routes; the depth lives where the moment sends you.** A rule the agent is not looking at when it acts does not exist for that act.
2. **A rule whose compliance depends on the agent remembering it at the decisive moment becomes a code path** — a test, a script, a required argument — because prose loses that contest.
3. **The file is maintained, not accumulated**: a pass at every release, and a fix at every mistake, with the receipt.

## The shape: a chain, not a manual

```
entry file (loaded every session)   — routes; holds only what every session needs
 └─ router rows: "when you are…"    — the rule that is easy to miss, and what to open
     └─ operative files (docs/, skills) — the procedure, the depth, the gotchas
         └─ evidence                — receipts, tables, postmortems, case studies
```

- **Root routes to entry points; entry points route to operative files; operative files link to evidence.** Each layer points down; none restates the layer below.
- **Route, don't summarize.** A summary of a doc in the entry file is a second copy that drifts. The entry file carries the one sentence that must be met at the moment — the rule that is easy to miss — and the pointer.
- **No workflow content duplicates upward.** When a procedure appears in two layers, the upper copy is wrong within a month.
- **Every file in the chain is reachable** from the entry file, and a new file is routed the day it is created, not later. `scripts/check_reachable.py` holds this (below).

## The entry file: two sections

- **Section 1 — how we build any app.** The mechanics: ownership and authorization, the threat model, the stack and the choices made on it, testing and delivery, working rules, the router, how this file is maintained. Reused verbatim in the next product.
- **Section 2 — this app.** What it is, its users, its shape, who can do what, scope, data constraints, three lines of status. Replaced per product (the `app-lifecycle` skill has its skeleton).
- **When they conflict, Section 1 wins on mechanics and Section 2 wins on product. What neither says is the agent's call** — decide, and say so in the summary. **When a library's default conflicts with the file, the file wins**, and the file says so where a vendored skill or a quickstart would teach otherwise.
- The preamble says all of this in a few lines, names where the longer material lives, and tells the agent to **find the moment it is in, in the router, before it starts.**

A starter file to copy: `references/agents-md-skeleton.md`.

## Make sure it loads

- **Claude Code reads `AGENTS.md` when no `CLAUDE.md` exists. A `CLAUDE.md` or `CLAUDE.local.md` that does not import `@AGENTS.md` silently stops `AGENTS.md` from loading** (verified on Claude Code 2.1.292, 2026-10-10). So keep no `CLAUDE.md`, or one whose first line is `@AGENTS.md`. Other agents (Codex, Cursor, Grok) read `AGENTS.md`. One master file, every agent reading it.
- **Frameworks write into these files.** Next.js 16's `next dev` appends to `AGENTS.md` and writes a `CLAUDE.md` (`2026-08-27`); `agentRules: false` in `next.config.ts` stops it. A generated `CLAUDE.md` holding only `@AGENTS.md` is harmless; anything else in it is a second, unowned instruction file.
- After changing either file, start a fresh session and ask it to quote a rule only the entry file holds. A file that did not load fails silently.

## The router — what opens when

A three-column table in Section 1: **When you are…** · **The rule that applies** · **Open**.

- **Rows are keyed by what the agent is doing, in the words a user would use** — "pushing a branch that deploys (*just push it* is this row)", "fixing a bug", "touching sign-in, roles or a permission" — never by topic. The agent matches its moment, not a table of contents.
- **The rule column is the part that is easy to miss**, in one or two lines. The file holds the depth.
- **The open column names the file — and the section — to read before acting.** Several rows can hold at once; open every one that matches.
- **Every new task opens its rows again.** At the start of each task, the agent finds its moment in the router and re-reads every file the matching rows open, even one it read earlier in the session: after a compaction or a long session, the earlier read is gone or stale. (The owner's call, `2026-10-29`; a content repository run by agents already reloaded its matching files after every compaction, and once a session was not enough.)
- **Every rule placed in a doc gets a row**, unless it lives in the file the agent is already editing when it applies.
- **File a rule at the fire point, not at its topic home.** A rule belongs in the chain of the task where it must *change a decision*; the topically natural file keeps the durable record and a pointer. Reachable in the wrong task is unreachable. (`2026-08-07`, a content repository: a rule governing a drafting-time decision was filed in the strategy file, loaded only in strategy sessions; the owner had to ask "when is strategy read?" before it moved.)
- What has no moment — a worked example, the release history — is indexed in the docs' own index, not the router.

The pattern in depth, and a starter router for an app repository: `references/router.md`.

## Where each thing goes

| What | Where it lives |
|---|---|
| needed in every session, with no trigger that would send the agent looking | the entry file, Section 1 or 2 |
| needed only when touching one area | that area's file: the doc its router row already opens, or a new one where there is none, routed the day it is made; re-read at the start of every task that touches it |
| procedures, gotchas, depth | the doc or skill the row opens |
| receipts, data tables, postmortems behind a rule | an evidence file, opened only when revisiting the rule |
| the current status | the product's plan (its stages, each with what it produces and the test of done, and where each stands); at most three lines in the entry file |
| what a release shipped, what its rounds and gates found | the release history (one dated section per release, never rewritten), moved there at the next release |
| a decision that had options | the decision log (dated: the options, what was picked, by whom and why) |
| deferred work | the backlog, each item with the reason it waits and the trigger that reopens it |
| a behaviour correction from one conversation | memory, until it graduates (`references/maintenance.md`) |
| what is true of one product only | that product's repository, never a shared skill |
| a rule whose compliance depends on memory at the decisive moment | a test, a script or a required argument |

## Always-on rules: an admission test and a cap

Most rules wait for their router row. A few must fire across every task — after the task has been classified, whatever it is ("before spawning any subagent, set its model explicitly"). They live in a short always-on list in the entry file, and **each entry passes an admission test**:

- it fires after task classification, so no router row would catch it;
- missing it does material harm;
- there is evidence it was missed repeatedly;
- it fits in two lines;
- nothing mechanical can enforce it — if something can, it becomes code instead.

**The list has a cap (ten bullets worked); a new entry replaces one.** Its entries route, they don't summarize. Without a cap the always-on list becomes the manual again.

## Budgets: every file short enough to read in full

**Each instruction and area file has a word budget, held by a check that runs.** A file over budget is one no session reads in full, and a rule not read is not met. (`2026-10-25`, a content repository run by agents: its rules had grown to about 330,000 words that no session could read, rules competed for attention and almost none was ever removed. It was rebuilt with a word budget per file, a checker and a write-time hook.)

- **The budgets live in one place** (`budgets.json` at the repository root, a path or glob to a word count), and `scripts/check_budgets.py`, copied into the repository, fails when a file is over or a key matches no file. The test gate runs that copy. Start each budget at the file's current count, rounded up, and lower it only with the owner.
- **One in, one out.** At the budget, a new rule replaces one that guards nothing irreversible, and every edit replaces or deletes before it adds; when nothing can go, ask the owner to raise the budget.
- **Every rule added carries its receipt and a review date**: the date and what happened, or the owner's words and the date, then `(review YYYY-MM)`. The checker lists every rule past its date, and the release pass puts each to the owner, who re-earns it or has it deleted; the agent deletes none on its own. A rule that guards an irreversible or outward-facing step (a promotion, a migration, a publish, a secret) is never retired for want of a new incident: it works by preventing one.
- **A new file in an area folder gets a budget the day it is made**, or it is data (receipts, research, tables) that no session is told to read in full.

## Prose vs. code

**Before encoding any rule, ask: does compliance depend on an agent holding this sentence in working memory at the decisive moment?** If yes, prose will lose, and the rule belongs in a code path: a required argument, a script, a validation, a test that runs. In one agent-run repository the evidence was one-sided — everything implemented as code worked, everything implemented as a prose obligation decayed — and its sharpest instance was a two-line code bug answered with a convention, which killed a scheduled job for five days five weeks later. **Writing it down feels like fixing it**, which is why the reflex is invisible from the inside. Prose stays for taste and judgement, kept short and routed to. The full evidence and the app-repository forms of a code path: `references/prose-vs-code.md`.

## The working rules every app's file carries

Each has a receipt (`references/working-rules.md`):

- **Read the instruction file before the first plan.**
- **No play-by-play.** Plan, build, summarize once.
- **Commit messages go through a heredoc (`git commit -F -`), never `-m "…"`**: a backtick inside `-m` is command substitution, and the text vanishes silently.
- **A fix that carries an exclusion says, in its comment, why the excluded case does not need it.**
- **A comment stating an invariant about a value protects only the file it is in**: list every route that can receive the value and check each.
- **When a flag's meaning widens, rename it to what it does**, not to one of its reasons.
- **When the file is silent, decide and say so in the summary.**
- **A doc that disagrees with code you did not change is reported, and the owner picks which side moves.**
- **Tests and doc lines are part of the change**, not a later step.

## The two passes

The file is yours to manage: edit it without asking. Two moments call for a pass:

- **At every release**, read it top to bottom and ask of each part: is it obsolete now that the code exists? does it belong in a doc, with a pointer here? is it needed in *every* session, or only when touching one area — then the router is its home? what did this phase teach that the next session must know? Then move the status and the release narrative out (below), and run the reachability check.
- **When a mistake happens**, if the cause was something the file should have said — or said badly — fix it here, in the moment, with the receipt (the date and what went wrong), so the rule carries its reason. Then ask whether the fix should be code.

**Status lives in the plan; the entry file carries at most three lines of it** — the current stage, what is in production, what is waiting on whom — never the story. At each release the previous release's narrative moves to the release history, and only the rules it taught stay, in Section 1. (A live Q&A product's status section grew until it was most of the file every session reads, and had to be moved out at least four times in four days.)

**Within its budget, no size target.** Judge by what a fresh session needs to start well, not by length: some things earn a permanent place in the entry file, and some things that feel obvious today will be the missing context in a month. A smart reader with the right context is the goal.

## Writing a rule

- **Keep the receipt**: the date and what happened, the product named by kind. The receipt is why a later reader trusts the rule — and the reason is the sentence they can check and find false.
- **Cite the violation before adding a rule.** A rule earns its place with evidence of a real failure; patterns from an outside style guide or linter are ideas, not rules.
- **Prefer replacing or generalizing a rule to adding one.** If the same check keeps firing, fix the principle upstream instead of adding another check.
- **Choose deliberately between a codifiable rule and a judgement principle.** Codify only when "is X present? yes/no" gives a useful answer; codifying judgement flattens it into checklist behaviour.
- **Date what a platform did or required** ("verified on", "observed"), and correct the line when it changes — never leave the old one beside the new.

## When the repository writes its own skills

A skill the repository keeps for itself (beside vendored ones) is general guidance and may be published. **A product appears in it only as an example, named by kind** ("a live Q&A product"). What is true of one product — its listings and their states, versions, verified clients, receipts, commits, release codes, ids, account names — goes in that product's own repository, never in the skill. **Date what a platform did or required, since it changes.** (Owner's rule, `2026-10-23`.)

## How you can tell it worked

A fresh session given only the instruction file meets each rule at the moment it applies, because the router sent it there, and every rule the file carries has its receipt.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/agents-md-skeleton.md` | a starter `AGENTS.md`: preamble, Section 1 with a router, Section 2 | creating the file for a new repository |
| `references/router.md` | the router pattern, how to key and word rows, a starter router for an app repository | writing or changing the router; a rule that was missed at its moment |
| `references/maintenance.md` | the release pass and the mistake pass, progressive-disclosure rules, filing without accretion, evidence vs. rules, memory graduation, orphans | a release; after a mistake; the file has grown; adding a doc |
| `references/prose-vs-code.md` | the test, the evidence, the receipts, and the forms a code path takes in an app repository | about to write a rule to prevent a recurrence |
| `references/working-rules.md` | the working rules with their reasons and receipts | writing Section 1; a rule here was broken |
| `scripts/check_reachable.py` | lists docs no chain from the entry files reaches (standard library only; reads, writes nothing) | after adding a doc; at every release |
| `scripts/check_budgets.py` | counts each budgeted file's words against `budgets.json`, fails over budget, and lists the rules past their review date (standard library only; reads, writes nothing) | in the test gate and a write-time hook; at every release |

```bash
python <skill dir>/scripts/check_reachable.py <repo>                       # docs/ and knowledge/ by default
python <skill dir>/scripts/check_reachable.py <repo> --scope .claude/skills --exclude "docs/screenshots/**"
python <skill dir>/scripts/check_reachable.py <repo> --why docs/TESTS.md   # print the chain that reaches it
python <skill dir>/scripts/check_budgets.py --root <repo>                  # words per file, past review dates
```
