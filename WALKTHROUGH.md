# Walkthrough: one idea, from the first prompt to the next round

This page follows one invented idea through the whole collection: what you type, what the agent does, and what it asks you to check. The product, a booking tool that private tutors pay for monthly, is only an example; what the agent does at each step is what the skills tell it to do. Commands are shown for Claude Code. In Codex, type `$` where this page has `/`. With the skill folders copied into a repository, drop the pack name: `/start-here`, `$start-here`.

You don't need to remember any of this. `/product:start-here` names the next step every time, and most of the skills it points to start on their own when the work matches. The page is here so you know what to expect.

## Before you start

1. **Open your agent in a folder**: an empty one for a new idea (the agent runs `git init` there), or the repository of a product you already have.
2. **Install the packs from that folder** ([Install](README.md#install)); in Claude Code the one-prompt install turns them on for that folder only; in Codex they install for your user, in every project. For this walkthrough: `product`, `ai-shipping`, `agent-teams` and `agent-harness`, plus `app-stack`: its `ui-design` and `uptime-monitoring` apply to any product with screens and a URL, and the rest mostly assumes a SaaS on Next.js, Supabase, Clerk and Netlify.
3. **Optional, and worth it:** the Codex CLI as a second builder and peer (`delegation`, its Codex reference) and the default reviewer (`independent-review`). The Grok CLI offers another model family (`--reviewer grok`), and `delegation`'s Grok reference drives it in any role. Without Codex, the session you work in builds the change itself or briefs a Claude subagent. The review starts fresh with the first installed of Codex, Claude Code and Grok. With none of the three CLIs, use a fresh read-only session of your agent. The wrappers that drive them need Python 3.9 or later.

## 1. Say what you have

```
/product:start-here I have an idea for a booking tool that private tutors pay for monthly
```

The agent reads your request and the folder: its agent instructions, product docs, plan, `git status` and recent commits. An empty folder and an idea mean the next step is research and a proposal. It names that step, the skill that does it (`propose`) and what you will be asked to check. Nothing is built yet.

The same command answers "where are we?" at any point later. Bring whatever you have: an idea, evidence from users, an agreed change, a bug, a release, or nothing at all.

## 2. Research, then one proposal artifact

Say "go ahead". The `propose` skill takes over. It is not an interview: questions come last, and only the ones the evidence can't decide.

**What the agent does:**
- **Reads what you shared**: notes, links, screenshots, competitor names. Then it researches what is missing: up to five alternatives tutors actually use, including substitutes such as a spreadsheet and a payment link, and doing nothing. When the segment is still open, it works on that too. It sets the value proposition and the value curve against the alternatives. If you want it, it also reads what people say in reviews and forums.
- **Marks every claim by kind**: an observed fact with its source and date, your call, its own inference, or an unsupported assumption. Your preference ("start with music tutors") is recorded as a decision. Your assertion ("tutors will pay monthly") stays a hypothesis with you as its only source, and the proposal says so.
- **Checks feasibility before drawing screens.** When the idea depends on something that may not exist or may not be allowed, it checks that before anything is drawn.
- **Proposes one direction**, or two or three with their trade-offs when the choice is real. It names the weakest assumption that would change the recommendation if it turned out wrong.
- **Builds one artifact you review**: a single HTML page kept in the repository (by default `docs/product/proposal.html`), and, where your agent can publish pages, a link to it (in Claude, an artifact). It holds the research, the jobs map, a high-fidelity screen per key job on sample data marked as such, and the open decisions, each with the agent's recommendation and the reason. There is no separate prototype: the first working version comes in hours, and you try the full flow there.

**What you do:**
1. Look at the key screens first.
2. Then read the research and the recommendation on the same page.
3. Make the open decisions. Each comes with the agent's recommended answer and the reason. Pick on the page where your agent saves picks (in Claude it can); otherwise copy your choices into the chat, or just answer there.
4. Accept the proposal, or say what to change. Once you accept, the agent updates the record, and the build reads it from there.

## 3. A plan, for a complex change only

Building the first version is a complex change, so it gets a plan. Ask for one with this prompt, every time:

```
The first version of the product in the accepted proposal. Create a plan. Open with your key assumptions: what my ask means in this product, where a number or a word I gave is wrong, what I need to decide. Then what to implement, each part with a rough size in builder hours, and the total, marking each requirement seen in use, asked for or assumed; the phases, when the full checks and reviews run, and the earliest point I can use it for real; how to test it (a test that would touch production, its users or its data runs only with my go); acceptance criteria.
```

The plan is for the agents as much as for you. The prompt names the least it holds; past that they plan whatever the build needs: phases and releases, the files and modules each phase changes, the order. That part goes into the repository, where the next session reads it. Your part is what it opens with, its key assumptions: what your ask means in this product, where a number or a word you gave is wrong, and what needs you to decide. Review those and question the ones that look wrong. When the change alters what people see or leaves choices open, they go on the proposal's page, with the screens of the flows that change in high fidelity and the choices still open, picked the same way. The testing is the agents': a test that would touch production, its users or its data still runs only with your go, and the agent asks before it runs. When the assumptions hold and choices are settled, say "build it".

**For a SaaS on Next.js, Supabase, Clerk and Netlify**, the plan is the `app-lifecycle` skill's stages, each built and checked before the next, each with its done-when. Say "Plan the first version as app-lifecycle's stages. Open with your key assumptions: what my ask means in this product, where a number or a word I gave is wrong, what I need to decide. Then what each stage implements, with a rough size in builder hours, and the total; how the stages group into phases, and when the full checks and reviews run; how to test it (a test that would touch production, its users or its data runs only with my go); its done-when" instead. The stages run from brief and design, through screens on sample data, setup and the first real slice, to browser proof, publishing, the front door and go-live. The accepted proposal artifact is its starting input.

A stage that offers options stops until you pick, such as two design directions. Four stages need you in a dashboard: setup, publishing, the front door and go-live. Setup includes development test mode, your own verification code and the first test account. The agent tells you which clicks it needs. You decide any stage skip or deferral, recorded in the plan with what brings it back; a broad go waives none.

## 4. Build

By default, every stage lands end-to-end tests of its changed journeys. The coordinator runs touched and new tests, reads the diff and corrected docs, and briefly checks running screens. The read of the diff runs the router rows it matches; an edited test, gate script or instruction file needs its reason. Use phone and desktop widths and both themes when two exist; the builder never substitutes for this look. A stage needs no mandatory full gate, fresh review or docs check.

One session coordinates. Another builds when one is available: Codex through `delegation`'s Codex reference, or a Claude subagent briefed through `delegation`. No session reviews its own work. A fresh reviewer that never saw the build reviews each completed phase and every deploying push. It reviews again after each fix to what a round found, until the bar holds.

The coordinator chooses phases containing related stages, sized for a few hours of builder turns and one state you can try. Two to four usually fit a first version; the plan message gives the split, cadence and rough builder-hour estimate. For the SaaS stages, 0–3, 4–7 and 8–9 are a suggested grouping. Stage 3 keeps its sample-data click-through done-when; the first deploy closes the next phase, and go-live reviews the whole product.

You don't review the code line by line. Three rules apply instead:
- **Every change lands with its tests and docs.**
- **Every fix lands with a test that failed before it.** After two fixes that pass and leave the symptom, the agent stops and gets one real observation instead of guessing again (`test-harness`).
- **A fresh reviewer that never saw the build reads each completed phase**, round after round, until a round finds nothing the change introduced above low severity, once its triage has weighed who meets each finding and how often, and nothing high or critical of any age (`independent-review`). It is the one your agent instructions name, when it can run the way `independent-review` requires (when it can't, their fallback runs if it can, otherwise the wrapper's reviewer runs without asking; if no other family can run, a fresh session of the builder's family; the report names who ran and why). With none named, start a fresh session with the first installed of Codex, Claude Code and Grok. With none of the three CLIs, use a fresh read-only session of your agent. It runs before every push that deploys, and again after each fix to what a round found. For a correctness review of your own, say "review this with ai-shipping's code-review skill"; in Claude Code name it `/ai-shipping:code-review`, because Claude Code has its own `/code-review`.

Before the first stranger is asked for anything (a sign-up, an email address, a payment), the agent drafts the terms and the privacy policy from what the code collects and sends, asks you for the facts only you have, and you approve the text (`legal-pages`).

When the app needs accounts, keys or a domain, the agent asks you to set them up and walks you through it. Keys you copy from a dashboard go where the agent asks, put there by you, never into the chat (a key that touched the chat is rotated). Production's come at go-live or later, only when the agent asks, and never where the app's development runs would read them, nor in the agent's environment, which everything it starts inherits: not the development checkout's `.env` files. Production's database connection string and a key made for the setup go into a production operator file outside the development checkout, never committed, under names the app doesn't read, such as `PROD_DB_URL`, loaded only into the one command that uses it (`supabase-production`, `environments`); the host's values at go-live step 3 (`release-gate`). A secret nobody issues, such as a cookie-signing secret, the agent generates; a webhook's signing secret comes from its dashboard, like any other key.

## 5. Your click-through

After phase checks, you get a link and the key user flows to try, each an action and what should happen. The order is full gate, coordinator exploration and visual checks, docs check, fresh review series, another full gate if fixes followed its last run, then the closing push where hosting exists. Visual fixes precede the series. Before hosting, the preview can use a development tunnel. Every deploying push still needs review first:

```
1. Sign up as a tutor and add Tuesday 4-6 pm: a student's booking page shows those slots in the student's time zone.
2. Book a 45-minute lesson as a student, then cancel it from the email link: the slot reappears on the tutor's calendar.
...
Not built yet: the monthly plan's limits.
```

Before it reaches you, the coordinator checks affected screens in the browser. For a new or materially changed journey or a kit change, the full `ui-design` checks also include a fresh-session walkthrough, screenshot critique and scored audit. Expect 15 to 20 minutes for a mid-size app. Your click-through can catch movement or brief states that screenshots miss. Feedback becomes stages of the phase in flight and receives review. The next phase can start while you try the preview. For an early preview, the agent names which phase review has not run and uses a development tunnel or reviewed push. Skip the click-through when only code behind a screen changed.

## 6. Release review

Before a release, the agent proposes the deeper checks, and you pick what runs. Each question has its own skill; ask in plain words, or name the skill.

1. **Are the docs right?** Say "check our docs against the code": `document-app` in check mode, with `intended-vs-implemented` reading the docs and the legal pages as intent.
2. **Are the tests right?** Say "is our coverage map current?": `derive-tests` in check mode.
3. **Security and performance?** Say "audit this release for security and performance": `static-audit` runs both on the release's changes.

The check modes and the audits only report. Where a doc, a test and the code disagree about what the product should do, you decide which one moves, because a doc rewritten to match faulty code blesses the bug. At the release, "ship it" also reviews everything unreleased again, round after round until one finds nothing introduced above low and nothing high or critical of any age. Older high and critical findings are fixed too.

**An app built without docs** gets all of this in one long pass: `/ai-shipping:ship-check`. It writes the system docs from the code, refreshes the agent instructions, reviews, maps test coverage and ends in a packet you sign off on. Where docs already say what the product should do, it lists what it would overwrite and asks first.

## 7. Release

"Ship it" brings in `release-gate`.

**What the agent does:**
1. Collects the evidence for every precondition.
2. Sends you a go/no-go: the checklist, the evidence and one paragraph.
3. After your go, promotes and then verifies that the build serving is the one that was reviewed.

**What you do, before the go:**
- Perform the done-whens this release closes yourself; the go message names any visible phase you have not tried.
- When a screen or its words changed, look over the changed screens and affected shared surfaces in each relevant state, theme, width and role, signed out where applicable. Sweep the whole product at go-live and for broad UI changes. Use the captures to help with the live walkthrough.
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
| `product-analytics` | what people did: recordings and heatmaps without analytics cookies, read back by the agent |

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
- **Codex builds** what is worth handing off (`delegation`, its Codex reference). The test is size: if the brief would be nearly as long as the change, the coordinator writes the change itself.
- **A fresh Codex session reviews.** Apply `independent-review` for the brief, scope and fallbacks.

The coordinator needs the skills, and so does a builder whose brief names one: install `app-stack` in Codex too, so a brief for screens or an MCP server names `$app-stack:ui-design` or `$app-stack:mcp-server`. The product keeps no copy of either. The reviewer starts without them on purpose. If you also work in Codex directly, install the other packs there too, since each agent reads skills from its own place. `agent-instructions` shows how to route to a skill from the product's agent instructions.

## What you do, and what you don't

**You:**
- inspect key screens and pick open decisions in the artifact;
- accept the proposal;
- review a complex change's key assumptions;
- pick and approve the design;
- set up accounts and keys in dashboards, put each key where the agent asks (never in the chat), and paste the few commands the agent gives you into your own terminal;
- try visible phases when available; your absence does not block the next phase;
- decide where a doc and the code disagree;
- before a release, perform what the stage promised. Explore changed screens and affected shared surfaces across the relevant states, themes, widths and roles, signed out where applicable. Walk the whole product at go-live and on broad UI changes;
- say go.

**You don't:** write tickets, read the test plan, review the code line by line, or approve a plan for a change you could check in a minute.

For a real product built this way, step by step, see the Product Engineering for PMs series linked from [How it works](README.md#how-it-works).
