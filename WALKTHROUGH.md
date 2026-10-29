# Walkthrough: one idea, from the first prompt to the next round

This page follows one invented idea through the whole collection: what you type, what the agent does, and what it asks you to check. The product, a booking tool that private tutors pay for monthly, is only an example; what the agent does at each step is what the skills tell it to do. Commands are shown for Claude Code. In Codex, type `$` where this page has `/`. With the skill folders copied into a repository, drop the pack name: `/start-here`, `$start-here`.

You don't need to remember any of this. `/product:start-here` names the next step every time, and most of the skills it points to start on their own when the work matches. The page is here so you know what to expect.

## Before you start

1. **Install the packs** ([Install](README.md#install)). For this walkthrough: `product`, `ai-shipping`, `agent-teams` and `agent-harness`, plus `app-stack`: its `design` and `uptime-monitoring` apply to any product with screens and a URL, and the rest mostly assumes a SaaS on Next.js, Supabase, Clerk and Netlify.
2. **Open your agent in a folder**: an empty one with `git init` for a new idea, or the repository of a product you already have.
3. **Optional, and worth it:** the Codex CLI as a second builder and peer (`codex-agents`), and the Grok CLI as a reviewer from another model family (`grok-agents`). Without Codex, the session you work in builds the change itself or briefs a Claude subagent. Without Grok, the review runs in a fresh Claude Code session with nothing carried over (with neither CLI, a fresh read-only session of your agent). The wrappers that drive them need Python 3.10 or later.

## 1. Say what you have

```
/product:start-here I have an idea for a booking tool that private tutors pay for monthly
```

The agent reads your request and the folder: its agent instructions, product docs, plan, `git status` and recent commits. An empty folder and an idea mean the next step is research and a proposal. It names that step, the skill that does it (`propose`) and what you will be asked to check. Nothing is built yet.

The same command answers "where are we?" at any point later. Bring whatever you have: an idea, evidence from users, an agreed change, a bug, a release, or nothing at all.

## 2. Research, then a proposal you can click through

Say "go ahead". The `propose` skill takes over. It is not an interview: questions come last, and only the ones the evidence can't decide.

**What the agent does:**
- **Reads what you shared**: notes, links, screenshots, competitor names. Then it researches what is missing: up to five alternatives tutors actually use, including substitutes such as a spreadsheet and a payment link, and doing nothing. When the segment is still open, it works on that too. It sets the value proposition and the value curve against the alternatives. If you want it, it also reads what people say in reviews and forums.
- **Marks every claim by kind**: an observed fact with its source and date, your call, its own inference, or an unsupported assumption. Your preference ("start with music tutors") is recorded as a decision. Your assertion ("tutors will pay monthly") stays a hypothesis with you as its only source, and the proposal says so.
- **Checks feasibility before the prototype.** When the idea depends on something that may not exist or may not be allowed, it checks that before anything is drawn.
- **Proposes one direction**, or two or three with their trade-offs when the choice is real. It names the weakest assumption that would change the recommendation if it turned out wrong.
- **Builds an interactive prototype on sample data**, every screen marked as sample data, with a link and the key user flows to try.
- **Writes one record**, by default `docs/product/proposal.md`, with the prototype linked from it.

**What you do:**
1. Try the prototype before reading anything else.
2. Then read the proposal.
3. Answer the few questions it asks. Each comes with the agent's recommended answer and the reason.
4. Accept the proposal, or say what to change. Once you accept, the agent updates the record, and the build reads it from there.

## 3. A plan, for a complex change only

Building the first version is a complex change, so it gets a plan. Ask for one with this prompt, every time:

```
The first version of the product in the accepted proposal. Create a plan. Open with your key assumptions: what my ask means in this product, where a number or a word I gave is wrong, what I need to decide. Then what to implement, how to test it (a test that would touch production, its users or its data runs only with my go), acceptance criteria.
```

The plan is for the agents as much as for you. The prompt names the least it holds; past that they plan whatever the build needs: phases and releases, the files and modules each phase changes, the order. Your part is what it opens with, its key assumptions: what your ask means in this product, where a number or a word you gave is wrong, and what needs you to decide. Review those and question the ones that look wrong. The testing is the agents': a test that would touch production, its users or its data still runs only with your go, and the agent asks before it runs. When the assumptions hold, say "build it". The agent may ask you questions first, and may show the plan as a page (in Claude, an artifact), which is easier to review than terminal text. The page is a view: the plan itself goes into the repository, where the next session reads it.

**For a SaaS on Next.js, Supabase, Clerk and Netlify**, the plan is the `app-lifecycle` skill's stages, each built and checked before the next, each with its done-when. Say "Plan the first version as app-lifecycle's stages. Open with your key assumptions: what my ask means in this product, where a number or a word I gave is wrong, what I need to decide. Then what each stage implements, how to test it (a test that would touch production, its users or its data runs only with my go), its done-when" instead. The stages run from brief and design, through screens on sample data, setup and the first real slice, to browser proof, publishing, the front door and go-live. The accepted proposal and prototype are its starting input.

A stage that offers options stops until you pick, such as two design directions. Five stages need you in a dashboard, because the agent can't make those clicks: setup, browser proof, publishing, the front door and go-live. It tells you which clicks.

## 4. Build

One session coordinates. Another builds when one is available: Codex through `codex-agents`, or a Claude subagent briefed through `delegation`. A different session reviews every change, so no session reviews its own work.

You don't review the code line by line. Three rules apply instead:
- **Every change lands with its tests and docs.**
- **Every fix lands with a test that failed before it.** After two fixes that pass and leave the symptom, the agent stops and gets one real observation instead of guessing again (`test-harness`).
- **A fresh reviewer that never saw the build reads each change**, round after round, until a round finds nothing the change introduced above low severity and nothing high or critical of any age (`grok-agents`). It is the one your agent instructions name, otherwise Grok when it's installed, otherwise a fresh Claude Code session with nothing carried over (with neither CLI, a fresh read-only session of your agent). It runs before every push that deploys, and again after each fix. For a correctness review of your own, say "review this with ai-shipping's code-review skill"; in Claude Code name it `/ai-shipping:code-review`, because Claude Code has its own `/code-review`.

When the app needs accounts, keys or a domain, the agent asks you to set them up and walks you through it. Keys you copy from a dashboard go where the agent asks (the app's `.env`, the host's settings, or, for a token the agent uses itself, the environment it starts in), put there by you, never into the chat (a key that touched the chat is rotated). Production's go in only when the agent asks for them: at go-live, once the production branch exists, or later for one a new capability needs. A secret copied from nowhere, such as a signing secret, the agent generates and writes itself, production's afresh.

## 5. Your click-through

Once the review is clean or running, for every change you can see, you get a link and the key user flows to try, each an action and what should happen:

```
1. Sign up as a tutor and add Tuesday 4-6 pm: a student's booking page shows those slots in the student's time zone.
2. Book a 45-minute lesson as a student, then cancel it from the email link: the slot reappears on the tutor's calendar.
...
Not built yet: the monthly plan's limits.
```

Expect 15 to 20 minutes for a mid-size app, every time. Screenshots taken by agents miss what moves and what is visible only for a moment, so this check is yours. What you find goes back to the build and is reviewed again. Click first when the question is taste or whether it's the right thing; skip it when only code behind a screen changed.

## 6. Release review

Before a release, the agent proposes the deeper checks, and you pick what runs. Each question has its own skill; ask in plain words, or name the skill.

1. **Are the docs right?** Say "check our docs against the code": `document-app` in check mode, with `intended-vs-implemented` reading the docs and the legal pages as intent.
2. **Are the tests right?** Say "is our coverage map current?": `derive-tests` in check mode.
3. **Security and performance?** Say "audit this release": `security-audit-static` and `performance-audit-static`, on the release's changes.

The check modes and the audits only report. Where a doc, a test and the code disagree about what the product should do, you decide which one moves, because a doc rewritten to match faulty code blesses the bug. At the release, "ship it" also reviews everything unreleased again, round after round until one finds nothing introduced above low and nothing high or critical of any age. Older high and critical findings are fixed too.

**An app built without docs** gets all of this in one long pass: `/ai-shipping:ship-check`. It writes the system docs from the code, refreshes the agent instructions, reviews, maps test coverage and ends in a packet you sign off on. Where docs already say what the product should do, it lists what it would overwrite and asks first.

## 7. Release

"Ship it" brings in `release-gate`.

**What the agent does:**
1. Collects the evidence for every precondition.
2. Sends you a go/no-go: the checklist, the evidence and one paragraph.
3. After your go, promotes and then verifies that the build serving is the one that was reviewed.

**What you do, before the go:**
- Perform the stage's done-when yourself.
- When a screen or its words changed, look over every screen in every state, theme, width and role, signed out included. The agent's captures help, but a person looks.
- At go-live, make the production dashboard changes the agent can't, such as connecting a real payment account to billing (`release-gate`'s go-live).

Then answer go or no-go in the chat. Silence is not go.

## 8. Real users, then the next round

Running it while people use it has its own skills, in `app-stack`:

| Skill | Covers |
|---|---|
| `environments` | which deployment uses which database and keys |
| `supabase-production` | the production database |
| `clerk-production` | sign-in, organizations, roles, and your customers' subscriptions (Clerk Billing) |
| `saas-authorization` | who can do what |
| `transactional-email` | email |
| `uptime-monitoring` | knowing when it breaks |

Nobody pays until payment works in production, so these are part of the method, not left for later. They cover your customers paying you. Payments between your users, such as a student paying a tutor, are not in these skills. The feasibility check in step 2 is where that comes up.

When you have evidence, bring it:

```
/product:start-here here is what the first 20 tutors did: <analytics, payments, support notes>
```

A product in use plus new evidence means `propose` runs again. It adds each dated observation under the hypothesis it bears on. Then it updates each hypothesis's status (supported, weakened, refuted or untested) and replaces the recommendation rather than adding a second one. What people did, or say they did, counts. What they say they would do is a hypothesis again.

## Other ways in

| You have | Type or say | What happens |
|---|---|---|
| A small change you can check in a minute | just say it: "rename the Book button to Book a lesson" | build and check; no proposal, no plan |
| A bug | `/product:start-here sign-in fails on Safari`, or just say it | reproduce it, fix it with a test that failed before the fix |
| An app that already exists, without docs | `/ai-shipping:ship-check` | the one-pass review and a shipping packet |
| A release | "ship it" | the gate, your go, promote, verify |
| No idea where things stand | `/product:start-here` | the stage you're in, and the next step |

## Between sessions

- **A new stage or a new area starts a fresh session.** What it needs belongs in the repository's docs and the plan, not in an old conversation.
- **Before the context runs out, or when work continues tomorrow:** `/agent-harness:handover`. It checks the record against the disk, writes the note the next session starts from, and ends with the one line to give that session.
- **When the same friction came up twice in a session:** `/agent-harness:retro`, before closing it. It turns the friction into a fix to your setup.
- **For work that runs for hours or waits on your decisions:** `flight-deck` keeps a status board that survives across sessions.

## With more than one agent

A typical setup:
- **Claude Code coordinates.**
- **Codex builds** what is worth handing off (`codex-agents`). The test is size: if the brief would be nearly as long as the change, the coordinator writes the change itself.
- **Grok reviews** (`grok-agents`).

A rule that lives only in another repository doesn't get read. So for a product built with more than one agent, copy the skills it depends on into the folder each of its agents reads (`.claude/skills/`, `.agents/skills/`), commit them, and name them in the product's agent instructions. In Claude Code, once every skill the product uses from a pack is copied, disable that pack for the repository (`/plugin`, or `claude plugin disable <pack>@product-engineering --scope project`), or each copied skill loads twice; a pack the product still uses uncopied skills from stays enabled. When Claude Code and Codex both work there, copy into both folders. `agent-instructions` shows how to route to a skill from those instructions.

## What you do, and what you don't

**You:**
- try prototypes and answer a few questions;
- accept the proposal;
- review a complex change's key assumptions;
- pick and approve the design;
- make the dashboard clicks the agent can't;
- click through each visible change;
- decide where a doc and the code disagree;
- before a release, perform what the stage promised and, when a screen or its words changed, look over every screen in every state, theme, width and role, signed out included;
- say go.

**You don't:** write tickets, read the test plan, review the code line by line, or approve a plan for a change you could check in a minute.

For a real product built this way, step by step, see the Product Engineering for PMs series linked from [How it works](README.md#how-it-works).
