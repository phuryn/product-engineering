# The owner's page: how to run it

`SKILL.md` § The owner's page says what the page is for and its rules. This file is the mechanics: the data, publishing, the loop, and the file to use in a session without the Artifact tool.

## The data

The page (`assets/owner-page.html`) renders three things from its database and nothing else.

**`status/current`**: one document, written by the agent, a projection of `STATUS.md`.

```json
{
  "phase": "Phase 3 of 5: billing",
  "percent": 55,
  "milestones": [
    {"name": "Prototype", "state": "done"},
    {"name": "Sign-in and data", "state": "done"},
    {"name": "Billing", "state": "now"},
    {"name": "First release", "state": "next"},
    {"name": "Go-live", "state": "next"}
  ],
  "done": ["Sign-in with Google", "The pricing page"],
  "now": ["The checkout stage, in review"],
  "next": ["The first release to production, once you give the go", "Custom domains"],
  "updated": "25 Oct, 14:10"
}
```

Only `phase` is needed. `percent` draws a bar; `milestones` are the plan's own phases, not tasks; the page shows at most three lines each of `done` (just built), `now` (in progress) and `next` (what's next), and adds "N things wait on you" itself. `done` is what landed since the owner last looked, in their terms, not a changelog: replace its lines, never append. Write the document when a milestone changes or a line stops being true, not on every step. It needs no republish. (Field names as a monitoring product's board ran them, 2026-10-25.)

**`items/<id>`**: one per thing that needs the owner. The agent writes it.

| Field | Holds |
|---|---|
| `kind` | `decision`, `task` (something only they can do) or `gate` (a go/no-go on a one-way door) |
| `group` | `now`, `decide`, `gate` or `later` (needed before a later milestone). Anything else shows under `later`. Work that will reach the owner but needs nothing yet is not an item; it is a `next` line in the status |
| `title` | the ask, in a few words |
| `what` | what you need from them, in their terms. Paragraphs split on a blank line; `[label](https://…)` becomes a link |
| `steps` | for a task, exact steps: what to open, what to click, which file or setting a value goes into |
| `link` | where: the page or dashboard it happens in |
| `why` | why only they can do or decide it |
| `rec` | your recommendation, in one or two sentences |
| `options` | for a decision: `[{"id", "label", "note", "recommended": true}]`. The recommended one is preselected |
| `after` | what you do once they answer |
| `order`, `updated` | sort order within the group; when it was added ("25 Oct") |

**`answers/<id>`**: written by the page when the owner presses Save. It has the same id as its item and holds `{at, note, choice}` for a decision or `{at, note, done}` for a task. Until you delete it, the item shows the saved answer in its form with "Saved <time>". There is no other state: no "read", no "replied".

**An answer outlives its item unless you delete both.** Deleting an item doesn't delete the answer saved under the same id, and orphaned answers pile up unseen (`2026-10-25`: 27 were found under items removed days earlier). Delete them in the same write.

## Publishing (where the Artifact tool exists)

1. Copy `assets/owner-page.html`. Change the `<title>`, and the `<h1>` if you like, to the project's name ("Acme: what I need from you"). Change nothing else.
2. Publish it with `capabilities: {db: {}}`. By default, everyone signed in who can open the page reads every document, people with Contributor access and up write and delete, and Viewers and Commenters never write (Claude's artifact runtime docs, read `2026-10-25`). So share the page only with people who may read every item on it.
3. Write `status/current` and the first items with the artifact's database tool in one batch, after publishing; with nothing for the owner yet, write the status alone. Never put them in the HTML.
4. Send the owner the link. On first use, ask them to save one answer, then quote it back, so they know Save works.
5. Keep the URL in `STATUS.md`. Put it in every chat message that mentions the page.

Reuse the same artifact for the whole project, and republish to that URL when the page changes. The database survives a republish.

## The loop

**Check for answers** at the fixed points in `SKILL.md`. Read the `answers` collection, or query `at` greater than the time of your last check, which you keep in `STATUS.md`.

**For each answer, in this order:**

1. **Record it.** Write the decision in the product's decision log (who chose, what, the date, the note's substance). Put whatever work it creates into `STATUS.md`'s QUEUED, and the reasoning into `LOG.md`.
2. **Delete the item and its answer together**, in one batch write, each pinned to the `version` your read returned (the database tool's `if_version`). If the owner saved again after your read, the batch writes nothing, and you read again. **For a gate, delete only the answer** (below).
3. **Then act**, from your records, not from the page. On a gate, only once the go is in chat.
4. **Confirm in chat** in one line: what you recorded and what happens next. The page never carries a reply.

If the answer raises a new question, delete the answered item and add a new one. Don't edit the old one into a conversation.

**A note on a gate doesn't close it; only a go typed in chat does.** Record the note and answer it in chat, delete only the answer (pinned the same way), and leave the gate on the page. A condition they set goes into the gate's `what`, so the go is asked against it.

**An answer in chat closes the item too**, and a gate only when it is the go. Record it the same way and delete the item. An item left open after the owner answered it elsewhere is the most common stale line (observed 2026-10-24).

**When an item stops needing them**, delete it, and its answer if there is one: you found a way to do it yourself, it was overtaken, or they did it without saying.

## Without the Artifact tool: the same page as a file

In a session where the Artifact tool does not exist (Codex, Cursor, a plain repository), keep `OWNER.md` at the root of the working area, shaped the same way:

```markdown
# What I need from you
Phase 3 of 5: billing · Running: checkout, in review · 2 things wait on you

## Your decisions
### Plan names for the pricing page
What I need: … Why only you: … I recommend: A.
Options: A. Starter / Pro (recommended) · B. Free / Builder
Your answer:
```

The owner writes under "Your answer:" and saves; you read it at the same fixed points, and the same consume rule applies: record it, delete the section, act, confirm in chat. Answered sections never stay in the file, except a gate's: it stays until the go is typed in chat, and you clear only its answer.
