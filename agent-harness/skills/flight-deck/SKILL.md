---
name: flight-deck
description: "Long agent work that must survive compaction: multi-hour runs, background jobs, work waiting on someone's decision, 'what's the status', 'where were we'."
---

# Flight Deck — surviving your own context window

An agent's memory of *what it is doing* is the first casualty of a long session. Tool output scrolls
away, context gets summarized, and what remains is a plausible narrative with the operational details
sanded off. The work keeps running; the agent's model of it quietly goes stale. Then it re-runs a paid
job it already ran, reports a number from memory, or forgets that something is blocked.

The fix is not a better memory. It is writing state down where it cannot be summarized.

**The flight deck is `STATUS.md`, `LOG.md` and the owner's page.** In any session where the Artifact
tool exists, build the page in the first pass as an artifact with a database (`capabilities: {db: {}}`)
from `assets/owner-page.html`, following `references/owner-page.md`; use `OWNER.md` only when the tool
does not exist. A test run, or a run with nothing for the owner to decide yet, still builds the page: it
carries the status too, and a test is where the page gets exercised.

## The two files (per area, not per repo)

**`STATUS.md` — the instrument panel. Rewritten in place. Only ever describes NOW.**

Never append to it. A status file that grows is a log wearing a status file's name, and the reader
cannot tell which line is still true. Sections that earn their place:

- **RUNNING NOW** — with process ids, log paths, and what each thing is waiting on
- **QUEUED** — in order, so "what is next" is not a judgement call
- **BLOCKED** — and *why*, and what would unblock it
- **HELD** — finished work deliberately not shipped yet, and who owes the decision
- **AWAITING <person>** — the questions you cannot answer yourself
- **DONE** — one line each, enough to prevent redoing it
- **EVIDENCE** — measurements with their actual numbers (see below)
- **STANDING RULES** — the constraints a fresh reader would otherwise violate

**`LOG.md` — the flight recorder. Append only. Explains WHY.**

Decisions, corrections, dead ends, the reasoning behind a call. Status answers "where are we"; the log
answers "how did we get here, and what did we already rule out". Both are needed and they are not the
same file.

Optionally, when the machinery is non-obvious, a committed **how-it-works doc**. Status and log are
volatile; that one is durable and belongs in version control and in your routing file.

## The owner's page

`STATUS.md` and `LOG.md` are for you. The owner's page is for the person who isn't watching the session (the owner), so they never read the transcript to find out where the work stands or what you need. It holds **only what needs them** (a decision, a go, a task only they can do) under a short status: they open it, answer, save, and you read the answers at your next check-in. It is `STATUS.md`'s AWAITING section made answerable. Without the Artifact tool it is `OWNER.md`, with the same shape. **Before building it, open `references/owner-page.md` (the data, publishing, the loop) and `assets/owner-page.html` (the page you copy).** (`2026-10-27`: of two sessions that ran this skill the same day, one read only this file, called the page overkill for a test, and built it only when the owner asked for it as an artifact.) The rules below come from a monitoring product built 2026-10-21 to 25, where the owner ran the whole build from such a page.

**What is on it**

- **At the top, where we are, short:** the phase ("3 of 5") and its milestones with the current one marked, then at most three lines each of what was just built, what's in progress and what's next, and how many things wait on them. Project it from `STATUS.md`, not every detail; a status block nobody reads to the end is no status.
- **Only what needs them:** a decision, a go on a one-way door, or a task only they can do. Never status, receipts, finished work, or anything you could do yourself. (`2026-10-24`: one item asked the owner to create database logins, which the agent then made itself. The owner's reply: "I'm not sure what you need… should I put it where exactly?")
- **Each item says** what you need, where (the link, the file or the setting), why only they can, your recommendation (preselected), and what happens after they answer.
- **Check every step against the product before it goes on the page.** A checklist sent the owner to open an incident with a button the product doesn't have.
- **Never collect a secret.** Name the file or setting the key goes into.
- **A go typed on the page doesn't clear your harness's permission check for a one-way door.** The page asks; the go is typed in the chat (`2026-10-24`, a production release).

**Once you have read an answer, the item and the answer are deleted**, except a gate, which stays until the go is typed in chat: a note on it deletes only the answer. No reply on the page, no "settled" list, nothing showing that their feedback was processed. (`2026-10-24`, the owner: "I don't need answers when something is done." Replies left on finished items had left him not knowing what to do with them.) Work in this order:

1. Record the decision (the product's decision log, `STATUS.md` QUEUED for the work it creates, `LOG.md` for the why).
2. Delete the item and its answer in one write. For a gate, delete only the answer: the gate stays until the go is typed in chat.
3. Act. On a gate, only once the go is in chat.
4. Confirm in chat, in one line.

Acting first leaves answered items on the page for as long as the work takes.

**Check at fixed points, because nothing notifies you when they save:** each stage boundary, while a build or review runs, before ending a turn, after a compaction, and whenever they say they answered. Answers the owner never mentioned were caught only this way. **An answer given in chat closes its item too**, and a gate only when it is the go.

**Make Save trustworthy.** The owner asked "Can you really read my answers?" (`2026-10-22`). The page says that Save is what you read and that nothing notifies you. On first use, quote one saved answer back. Put the link in every chat message that mentions the page ("What was the url of the artifact", `2026-10-23`).

## The rule that makes it work

**Update `STATUS.md` on every state change** — a job starts, finishes, fails, gets published, a
decision lands, something becomes blocked. Not "at the end", not "when asked". The moment it changes.
A status file that is 80% true is worse than none, because it is trusted.

Keep it short enough to stay true. If maintaining it is a burden, it is too detailed.

## Write down evidence, not just tasks

The highest-value lines are measurements: probe results, benchmark numbers, verdicts, costs, "we tested
X and it does not work". Losing task state costs you a re-read. Losing *evidence* costs real money and
credibility: you re-run a paid experiment, or worse, you restate a number from a summary and get it
wrong. Record the numbers and the verdict, not the conclusion alone.

## Where to put them

One pair per **area of work**, not per repository. A repo with three unrelated efforts wants three
pairs; three repos serving one effort want one. The area is the unit someone would ask a status
question about.

Put them where they survive but do not pollute: a scratch or working directory is right for volatile
state. Then **cross-link them** — from the log to the status, from any long-lived doc to both — so a
fresh reader lands on them by accident rather than by luck.

## Reading them after a compaction

`STATUS.md` first, then skim `LOG.md` for the last few decisions, then verify: check that a process
listed as running is actually running. **Do not trust the file over reality** — reconcile, then fix the
file. A stale status file caught early is a small problem; one trusted blindly is how you report that a
job finished when it crashed an hour ago.

## When NOT to use this

Short sessions, single-shot tasks, anything that fits comfortably in one context window. The overhead
is real and pointless there. This pattern earns its keep exactly when a session will outlive its own
memory — which you can usually tell at the start, from the presence of background jobs, queues, or a
run measured in hours.

## How you can tell it worked

After a compaction, one read of the status board says what is running, what is blocked and on whom, and every line of it still matches what is on disk and what is running.
