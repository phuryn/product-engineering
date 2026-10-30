---
name: grok-agents
description: "Before 'ship it', a deploy or release, for 'an independent review', and after each fix until a round is clean: a fresh reviewer that never saw the build."
---

# Independent review — the gate before a change ships

**The session that wrote the code never clears it.** A fresh reviewer that never saw the build
reads the change and says what would block or break it. That separation is the whole mechanism,
and it does not scale down with the size of a change: a one-line fix gets a short round, never no
round.

**The tool is optional; the review is not.** The wrapper in this skill's `scripts/` picks the
reviewer (`python <skill dir>/scripts/grok_review.py --check` says which): **Grok** when its CLI is
installed (read-only tools; its memory, its managed MCP servers and its Claude, Cursor and Codex compatibility, session reading included, off for the run; what still
loads, the wrapper reads from `grok inspect` and prints for the report: in a folder Grok trusts, that
includes the project's own instruction files, a gitignored `CLAUDE.local.md` among them, which a review
worktree of the snapshot doesn't hold), otherwise a **fresh headless Claude Code session** — read-only tools, no settings, hooks,
plugins or MCP servers, no auto-memory, no saved session, so it starts from the repository and the
brief alone. Never the building thread, resumed or forked, and never a subagent of it: the reviewer
must not inherit what the builder believes. A same-model reviewer shares more of the builder's
blind spots than a different model does; that cost is accepted, because a round that runs beats one
that is skipped. Everything below holds whichever reviewer runs.

**The repository's own instructions come first.** Its agent instructions or release docs may say
which reviewer runs, when a review is required, which range a release covers, what the test gate is and where deferred
findings go. Follow them. **One bar for every reviewer**, the wrapper's and one they name: a fresh session
that never saw the build, never a resume, fork or subagent of it, with read-only tools only, no MCP servers
or connectors, its memory off, at its highest effort, and the project's and the user's own instructions off
where the CLI allows; what it can't switch off, the round's report names. A sandbox flag alone is not that: in Codex, `-s read-only` binds only
the shell commands the model runs, and the user's config can add tools that act outside it (Codex CLI 0.159.0,
`2026-10-29`). A named reviewer that can't be run that way is not replaced on your own: say what it lacks and ask
the owner whether the wrapper's reviewer runs instead, naming it (Grok, so xAI, or Claude); the round
waits for the answer, and its report records it. Where they say nothing, the defaults below apply, and where a default
would need a fact only the owner has (which branch is released, what the last release was), ask.

The loop is: fix → re-run the project's test gate **yourself** → a **fresh** reviewer reviews the
changed state → verify every finding against the code **yourself** → fix → repeat.

Findings are **claims, not results** — including their severity labels. Triage below is not
optional politeness; it is the part that most often goes wrong.

## When

- **Before every release**, however green the tests are. A release without an independent pass is
  not a release.
- **Before every push to a branch that deploys.** When a push is what users receive, "just push
  it" means a round first. The push closes the round (below). **The first push goes only where the
  owner named**: every URL `git remote get-url --push --all origin | sed -E 's#//[^/@]*@#//#'` prints
  (the `sed` drops a user name or token a URL can carry) must be that repository; where one isn't,
  push nothing and ask.
- **Again after fixing anything a round found** — the fix is itself unreviewed code, and fixes are
  where the worst defects come from. Never report a change ready off a review that found
  something, however small, however confidently fixed. (`2026-10-22` to `24`, a monitoring
  product: in about 140 rounds, commit messages name at least seven chains in which a round's
  finding was caused by the previous round's fix. In one, keeping an incident already open folded
  a real outage into a seeded test incident, so uptime never dipped; the next round caught it.)
- Optional and cheap at a stage boundary inside a long piece of work, so findings arrive while the
  code is still warm instead of all at once at the end.

## The subject: computed from git, and it narrows after round 1

Describing the diff in prose is how an unapplied migration or an untracked file goes unreviewed.

**Round 1** takes everything unreleased, committed or not: from the last release to `HEAD`, plus
the working tree.

```bash
git log --oneline $RELEASED..HEAD               # the unreleased commits
git diff $RELEASED...HEAD --stat                # its shape
git status --porcelain -uall                    # and anything uncommitted, file by file
```

**Read that status for what does not belong, too.** The wrapper inlines every untracked file under
200 KB with its content, and the cap is per file, so a directory of small generated files — copied
data, fixtures, scratch output, a build artefact with no ignore rule — goes in whole, and the turn
cap rises to fit it. What is not part of the change goes into `.gitignore` or is deleted before the
round. A subject far longer than the diff's `--stat` suggests usually means this happened; the
wrapper warns when untracked files add more than 20,000 lines or most of a subject over 5,000, and
never refuses. (`2026-10-11`, 364 data files left untracked swelled a round's subject to 89k lines;
the round was stopped, the directory deleted and the round run again.)

`$RELEASED` is what the repository says was last released — a production branch
(`origin/<prod>`), a release tag, the deployed commit. If nothing has been released yet, round 1 is
everything since the project started: `--subject HEAD`, for which the wrapper writes the log with each
commit's author and message, every file HEAD holds, the first commit's included, and every line its
history removed, since a push sends every commit (`<first commit>..HEAD` would leave that commit out). A product whose history began in another
repository (a clone, or a fork) takes the same `--subject HEAD`; that repository's tags and branches are not the product's releases.
Before any release nothing is live yet, so the brief says every finding is INTRODUCED, code that came with the
history included. Round 1 includes what is already pushed: when a push is the deploy, pushed code is
exactly what users are running. **Never narrow the range by hand to make it fit**: too narrow skips
code. A range too large to read in one round is split, never shortened, in one of two ways:

- **By commits, when the history falls into stages.** Each round takes a contiguous slice as its
  subject and the rest of the range as context, oldest slice first, so each later round reads the
  earlier slices' code for interactions. This fits a range of a few build stages.
- **By surface, when the history does not partition**: the first release, whose range is the
  whole product, or a range whose commits each touch everything. Each round takes the whole range
  and owns one area of the product, which it reads in full (the public surfaces; data, permissions
  and money; the screens a member uses), with the other areas named as context; between them the
  areas cover every changed file. Area rounds read one still snapshot, so they run in parallel,
  each with its own brief and output file. (`2026-10-22`, a monitoring product's first whole-range
  review, split by surface: the rounds on the public surfaces and on data and screens found a
  paused component drawn green on the public page and an address that handed its password to
  every visitor. Three area rounds started at once had all read the last brief written, which is
  why the wrapper names its prompt and subject files per run.)

**Every later round** names only the commits since the previous round as the subject, and hands
the rest of the unreleased range over as **context to read for interactions**. Naming which code
is new is *scoping*, not steering, so the un-steered property survives. Re-reviewing cleared code
drags a round out, buries the new findings under known ones, and tilts the round toward
pre-existing noise — passes are what find bugs, so cheap rounds beat thorough ones.

Both halves earn their keep: a whole-range pass sees composition that per-commit rounds cannot.
Old code enters scope only where the change makes it **newly reachable or newly wrong**. Say that
explicitly in the brief — interactions are where the serious findings live.

**Scope the subject by what a reviewer must read, not by file count, and keep generated prose out
of it.** Hand generated docs over as context for code questions, not as review subject: prose can
exhaust a round that comfortably fits the code and tests. (`2026-09-17`, one commit reviewed as
code completed; the same commit reviewed with its docs exhausted the round.)

## Running it

The wrapper picks the reviewer, applies every flag below, and fails loudly on a round that came
back too short to have run:

```bash
S="<a scratch directory>"
python <skill dir>/scripts/grok_review.py \
     --brief "$S/review-NNN-brief.md" --cwd <repo> \
     --subject "<range>" --out "$S/review-NNN.md" < /dev/null
echo "exit=$?"   # 2 means the round was too short: treat it as failed
```

`--subject` takes the git range under review (`<sha>^!` for a single commit, `HEAD` before the first release). The wrapper refuses
an empty `--subject`, a range with no start, and one with no commits and a clean tree. The reviewer has no shell, so the wrapper writes the
range's log and diffs, then everything uncommitted (untracked files listed one by one, with their
content), to a file inside the git directory (never committed), and tells the reviewer its length
and to page through it: one file read returns at most 1,000 lines and may not say there are more.
It raises the turn cap when the subject needs more turns than that to page through.

**A range that contains a merge also carries the range's cumulative diff**, because `git log -p`
shows a merge commit without its diff: a conflict resolution, or an edit made inside the merge,
would otherwise never reach the reviewer. The wrapper adds it for an `A..B` or `<sha>^!` range (a bare
ref such as `HEAD` needs none: its subject is every file it holds and every line its history removed); it warns on any other shape. It repeats every commit's change once more, so it can nearly double the
subject; size the round with it in mind.

`--reviewer auto` is the default: Grok when installed, else `claude -p` with `--restricted`,
`--tools Read,Grep,Glob`, `--strict-mcp-config`, `--no-session-persistence`, `--effort max` and
`CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` (measured 2026-10-10: without that variable a headless session
loads the project's memory index, which holds the builder's notes; with these flags no project
instructions, personal notes, memory or skills list was in its context). `--reviewer claude`
forces the fallback. Neither CLI on PATH: `--subject-only` (with `--brief`, `--cwd` and
`--subject` as above) writes the subject file and the prompt, the brief with the paging instructions added,
into the git directory and prints their paths. Give the prompt to a fresh read-only session of your agent,
run as a separate process you start in the checkout under review, never a subagent, fork or resumed session of
this one: read-only tools, no MCP servers or connectors, the highest reasoning effort it offers, and its memory
and project and personal instructions off where it allows that (in a review worktree the git directory sits
outside the checkout, so give it read access there, never write). Where none can be started, stop and hand the owner the prompt's path: the round hasn't run
until a fresh session answers. Treat a short clean answer as a failed round, and delete both files when the
round ends.

The equivalent bare Grok call, so the flags are understood rather than remembered (the wrapper also
adds the turn cap and writes the subject file, which a bare call needs prepared by hand and named in
the brief):

```bash
grok --prompt-file "$S/review-NNN-brief.md" \
     --cwd <repo> \
     --reasoning-effort xhigh \
     --tools read_file,grep,list_dir --disallowed-tools search_tool,use_tool \
     --deny MCPTool --deny Bash --deny Edit --deny Write --disable-web-search \
     --always-approve \
     --output-format plain < /dev/null > "$S/review-NNN.md" 2>&1
echo "exit=$?"
```

Every flag there is load-bearing:

- **`--prompt-file`, never an inline `-p "…"`.** A long prompt inline trips the permission
  classifier and the call is refused. The brief is always a file.
- **`--always-approve`** or the round does not happen. Without it Grok cannot approve its own file
  reads, and it exits **0** after a sentence of preamble — no error, no timeout, a clean-looking
  result that reads as "found nothing". This failure is biased toward silence and will always look
  like good news. **The tell is length, and it is the only tell**: a genuinely empty round still
  argues its way there over paragraphs. Treat a suspiciously short clean round as a **failed**
  round and run it again. Require an empty round to argue what it read, what it expected to find
  and why it holds. (`2026-09-17`, a round's short output could not distinguish completion from
  silence.)
- **`--tools read_file,grep,list_dir`** is the write boundary: an allowlist of read-only tools, so
  a review cannot edit the tree it is scoring. Not `--sandbox read-only`, and not a denylist such as
  `--disallowed-tools edit,write`: the sandbox enforces only on platforms that support it, and a
  denylist leaves the shell and the edit tool in place. (`2026-10-10`, on Windows: those two flags
  together still let a round create a file; the allowlist did not.) With no shell the reviewer
  can't run git, which is why the subject goes on disk first.
- **`--disallowed-tools search_tool,use_tool`, the `--deny` rules and `--disable-web-search`**
  close what the allowlist leaves open. `--tools` covers built-in tools only: the MCP meta-tools
  stay, and through them every connected MCP server, a database included, so they are removed
  (`--disallowed-tools` wins over `--tools`) and every MCP call, shell command, edit and write is
  denied (a deny rule wins over `--always-approve`). A review reads the repository and nothing
  else. (`2026-10-10`: with these flags a round asked to write, call MCP tools and run a shell had
  only `read_file`, `list_dir` and `grep`, and did none of them.)
- **`--reasoning-effort xhigh`, on the newest Grok model the CLI offers.** `xhigh` is the highest
  effort the wrapper accepts; the default effort is lower and the difference shows up as missed
  races. No model is named here, so the CLI's default is used: `grok models` lists what it offers,
  and the wrapper's `--model <id>` pins the newest when the default is not it.
- **`--cwd`** is required, so the session is scoped to the repository under review.
- **`< /dev/null`.** Without a closed stdin the CLI waits for interactive input forever.
- Never a bare `grok` with no prompt flag: it opens the interactive TUI and hangs with no output.
- A round takes minutes at the highest effort. Run it in the background.

**A round can fail by running out of room, leaving the same short output.** Read the log: memory
flushes distinguish exhausted context from a reviewer that never read anything. Size the subject to
a build stage, not a span; keep and verify findings emitted before failure. (`2026-09-17`, a round
exhausted context across 77 files and stopped after one real finding.)

## Running a round beside the next stage, not before it

A round takes minutes and a build stage takes tens of minutes. Run them at the same time. What
makes that safe is not the commit — it is the checkout.

**Commit means "reviewed from here". Push means "this round is closed".** Local history is working
state; the branch on the remote is what a round has already cleared. A push to production is still
a release and still needs the owner's go.

    # 1. tests green on your own run, then freeze the subject
    git add -A && git commit -F -          # the snapshot the round reviews
    SNAP=$(git rev-parse HEAD)

    # 2. give the reviewer its own checkout of that exact commit, under a name no other
    #    session on this machine is using (`git worktree list` shows the taken ones)
    git worktree add ../<repo>-review-<stage> "$SNAP"

    # 3. review there while the next stage builds in the main tree. In the worktree the
    #    range ends at HEAD, the snapshot ($RELEASED..HEAD, <last round>..HEAD), never at
    #    a branch name, which moves as the next stage commits
    python <skill dir>/scripts/grok_review.py \
         --brief "$S/review-NNN-brief.md" --cwd ../<repo>-review-<stage> --subject "<range>" ...

    # 4. when a round closes with no INTRODUCED finding above Low and no High or Critical
    #    of any age, push the snapshot THAT round reviewed — never the branch tip, which may hold the next stage's commits. A
    #    round that found something is fixed, re-tested, re-snapshotted and reviewed again;
    #    SNAP is read from that round's worktree, whose HEAD is the snapshot it reviewed
    #    (a new shell has lost it, and the main tree's HEAD may hold the next stage); `:?`
    #    refuses an empty one, which would turn the push into a delete. The first push goes
    #    only where the owner named (§ When)
    SNAP=$(git -C ../<repo>-review-<stage> rev-parse --verify HEAD)
    git push --no-follow-tags origin "${SNAP:?}:refs/heads/<branch>"
    #    (if you linked node_modules into the worktree, delete that link first; see below)
    git worktree remove ../<repo>-review-<stage>

**Never remove a worktree whose `node_modules` links to another checkout.** The reviewer only
reads, so the review worktree needs no `node_modules`. But when one is linked in so a typecheck,
the unit tests or a build can run there (a junction on Windows, a symlink elsewhere),
`git worktree remove --force` deletes *through* the link and empties the main checkout's
`node_modules`: a gate or dev server running there dies, and the next run fails with
`'playwright' is not recognized`. Remove the link itself first — on Windows
`cmd /c rmdir <worktree>\node_modules` removes a junction without touching its target, elsewhere
`rm <worktree>/node_modules` with no `-r` — then the worktree. Or give the worktree its own
`npm ci`, which `next build` needs anyway. (`2026-10-02`, a temporary worktree's junction; `npm ci`
restored the main checkout.)

**Push the snapshot, not the branch.** Once a push deploys, a push of the branch tip would ship
whatever the next stage committed while the round ran, unreviewed. Those commits are the next
round's subject.

**The worktree is the load-bearing part.** Committing alone does not isolate anything: the reviewer
reads the working tree as well as the diff, on purpose, because a diff cannot show an interaction.
Point it at the tree the builder is editing and it reports on half-written code — findings that are
real about a file that no longer exists that way, which is the most expensive kind of noise there is.

**A push can have side effects beyond the deploy**, such as an integration that applies database
migrations on push or a hook that publishes. Do what must happen first (apply and verify the
migration by hand, for example) before the push, so the push finds nothing pending; a production migration also waits for the
owner's go (`release-gate`). A file you do not intend to run must not sit where such an integration picks it up. (`2026-09-16`, a migration
that could not have applied cleanly was moved out of the migrations directory for exactly this
reason; `2026-10-22`, a review found a migration revoking two worker boxes' table grants sitting in
the migrations directory while both still ran the build that needed them, so the routine push
would have applied it early.)

**What parallelism costs.** Findings arrive against code that has moved, so a fix lands on a
changed tree, and a finding that invalidates something structural can cost the newer work. That is
a fair trade at a stage boundary where the foundation is settled. It is not a trade at the end:
**the whole-range round before a release still runs against a still tree**, because that is the one
that has to see everything at once.

## Writing the brief

Five parts, in this order. Anything else is steering.

1. **Orientation.** What the product is in two sentences, which files are the binding spec (its
   agent instructions, its architecture docs), and how the pieces fit — the trust boundaries, the
   ownership model, where writes go. A diff alone cannot show an interaction.
2. **The subject**, pasted from the git commands above, with the earlier range named as context.
3. **The usage model**, so it can calibrate severity — who is on which surface, how many, at what
   moment. Say what stays serious however exotic the trigger (for most products: another tenant's
   data, private data on a public surface, a lost or duplicated write, anonymous access to a member
   capability) and what does not block (cosmetic divergence the next refresh fixes).
4. **The job.** Find what would block or break this release. Label every finding **INTRODUCED** or
   **PRE-EXISTING**. Require each one to state **the literal sequence that triggers it and who
   performs it** — a finding that cannot name its trigger usually has none, and demanding it makes
   over-claiming visible in the report instead of after a fix has been briefed.
5. **The form.** A numbered list: claim, evidence as `file:line`, what to change. Terse, no praise,
   ranked. End with the ones most likely to bite.

Do **not** include: what an earlier reviewer found, which files you suspect, your own argument for
why the design is right, or a request for a verdict. A reviewer asked whether it approves will tell
you it approves.

## Triage — the part that goes wrong

**Question zero, before any other: say in ONE SENTENCE what actually goes wrong for the person.**
If the sentence does not sound bad read aloud, there is nothing to fix. *"You land on one of your
own items that a filter was hiding"* dies unaided. A reviewer's severity label is part of its
claim, and taking one at face value is how a clean release grows two invented P1s.

The test that settles most of them: **does anything cross a line the person cares about?** Another
tenant's data, private data on a public surface, another user's private content, a thing they made
that disappears, a write that is lost, anonymous access to a member capability. If everything
involved already belongs to them and stays visible, it is a surprise, and a surprise is polish.
Distrust a real mechanism plus a scary label whose harm is speculative; ask whether the person can
see where they are. Builder reports and reviewer priorities are both claims; neither model decides.
(`2026-09-03`, a costly fix was reverted after the owner rejected its claimed High severity.)

Then three questions, and a finding that cannot answer them is not a finding:

1. **What exact sequence produces it?** Not "an attacker could" — the literal steps, in order.
2. **Does this system permit that sequence?** Check the code that would have to allow it. This is
   where most die.
3. **Who does it, and why?** If it needs someone already holding the owner's session on the
   owner's own screen, they had the screen.

**A layout or performance claim is settled on the running build, not by re-reading the file — in
either direction.** Arithmetic from a stylesheet can be right and the conclusion false (a flex
item's automatic minimum is its content, so cells wider on paper than their container can shrink
rather than overflow), and "obviously it shrinks" is as much a guess as "obviously it overflows":
measure before accepting *or* rejecting. Measure the text a reader sees against its neighbours in
the same column, not the container the finding names: matching box edges can be produced by the
defect itself. A performance claim is measured on both builds, the baseline built from `HEAD` in
its own worktree, and the numbers can retire the fix. (`2026-09-20`, a reported overflow measured
16px clear at ten widths; `2026-09-21`, a full-bleed card's edges matched its neighbours' while its
text started at x=14 and theirs at 30; `2026-09-25`, a proposed layout-shift fix addressed 0.002 of
shift while the real source was a poll.)

**When findings cluster, look for one false premise underneath before fixing any of them.** Three
findings in one review came from a single wrong assumption about the product.

**Rank by what it costs this product, not by where it sits in the list.** Read both user and
business impact: ask who sees it, how many, at what moment. A widely seen instruction failing at a
critical moment can cost more than its mechanism suggests; a recoverable flow one admin meets once
can cost less than its label.

**A fix has a price, and the price compounds.** This question gets skipped because a confirmed
defect feels like a task rather than a decision. The tell that a loop has gone too far is **rounds
that get narrower** — each trigger needing more actors or more precise interleaving than the last.
That is the loop finding what the code permits rather than what users hit. So ask out loud: what
does this fix cost to *understand*, next year, by someone who was not here? Is the residue
acceptable — say the price in plain words, and if it is acceptable, **write that down and stop**.
Does the fix *replace* a mechanism or *add* one? Replacing is usually right; a special case per
round is the spiral. **Accepting a finding is a legitimate outcome**, and a rarely-wrong rule
somebody can hold in their head beats an always-right one nobody can.

**A fix that did not need to happen is itself a defect.** Its branches, permanent complexity and
new review surface have a cost. Weigh that against the occasional harm the finding actually does.
The cheapest way to find out is the fix's regression test run on the tree before the fix: if it
passes there, the finding was false, so revert the fix and keep the assertion (the `test-harness`
skill holds the rule).

**Prefer removing the rare case to supporting it.** Constrain the input, refuse the state, drop the
option or choose a default that cannot produce it. An unreachable case needs no code, test or
comment and cannot interact with the next fix. Ask whether it must exist before writing its branch;
only then weigh fixing against accepting the residue. (`2026-10-10`, four rounds each patched the
last round's guard on a recorded marker; computing the value instead of recording it ended them.
`2026-10-22`, four rounds each found another encoding in which a stored secret header slipped past
a masker; sending that header only to the exact address it was saved for ended them.)

**Beware the fix that opens a door.** One round's guard enabled the next round's theft, and a later
guard silently reinstated a defect two rounds older, because two conditions that were each right
alone were wrong together. Nothing caught it — not the suite, not the next round. Which is exactly
why the loop continues past the fix that felt final.

**Fix the class, not the instance.** When a finding rhymes with an earlier one, say so in the next
brief and ask for the audit.

**When the actor is an attacker, ask whether the finding adds a capability the attacker does not
already have in that position.** A real mechanism that grants nothing new is a description, not a
vulnerability, and question 2 above passes far too easily for it. The tell is a finding that
reasons forward from one entry point without reading the neighbouring rows of the permission table.
(`2026-09-04`, a remote-control product: a compromised relay could inject a credential into a
desktop machine, which was true step by step; it was gated, the gate needed a fix of its own, and
both were reverted once someone read the same table and saw that relay could already send prompts
and approve the tool calls they produce. The injected credential granted strictly less.)

**When a fix needs a second fix, delete the first.** Machinery added in response to findings
produced a new defect in nearly every later round, each fix creating its own inverse; four
mechanisms were built and then deleted (`2026-07-31`, again `2026-08-17`). Several rounds of
inverses in one area mean the design is wrong, not the code: revert, then ask **once** what signal
the design is missing. A redesign earns that attempt only if it removes machinery — a
liveness probe that deleted a timeout no value could make right (`2026-08-20`) — and one more
elaborate than what it replaces is the spiral again. Scale this by whether the work was asked for:
hardest on hardening nobody requested, lightest on a feature the owner asked for by name, which
this rule once abandoned wrongly.

**Improve the average; the exception is the person's work.** Polish serves the case most people
meet and lets the rest degrade honestly, with the geometry intact — a placeholder of the same size,
so nothing jumps when the real thing arrives. Anything that loses or duplicates what a person made
gets the full treatment however rare. (`2026-08-21`, a transcript cache grew four negotiating
mechanisms over one question the host already answered.)

**Say it plainly when a round is empty after triage.** "Three findings, none survive the usage
model" is a result, and the expected one on a well-built change.

**When a round changes one user-facing sentence, read its neighbours and the assertions around its
pin.** The repair can draw attention away from a nearby claim it just made false. (`2026-09-17`,
three consecutive rounds each found another false sentence beside the previous fix.) **When a
state every doc describes changes** (production now exists, a feature went live), search every
doc for the phrases of the old state and fix them in one pass, instead of the one line the round
named. (`2026-10-24`, a monitoring product: eight rounds in one day each found more lines still
describing production as unbuilt; the first sweep by phrase came at the fifth, and later rounds
still found stragglers.)

**When a repair delegates behaviour to the platform, enumerate what the old code decided.** A
deleted handler takes its judgement with it; the diff shows only deletion. (`2026-09-17`, native
dialog dismissal lost the guard against closing during an in-flight action.)

## The stopping rule

Stop when a round produces **no INTRODUCED findings above Low** and no High or Critical of any age
(those are fixed now, below). The loop does end, and it ends
fastest when each release is small: a monitoring product's five production promotions on
`2026-10-24` each closed on such a round, after 9, 5, 1, 2 and 1 rounds. The first, the whole
product, took the most; each later one reviewed only its own commits.

Pre-existing findings go where the repository keeps deferred work (its backlog file or issue
tracker; ask if it names none) with the reason they were deferred **and a revisit trigger** —
except High and Critical ones, which are fixed now regardless of age. The trigger is what gets it
fixed: a Low deferred "until a paid-only location goes live" was closed the day that location
went live (`2026-10-24`). Silently dropping a finding is the failure mode. The release summary says
how many findings each round produced and what became of each, including the ones judged not worth
fixing and why.

**Number rounds in one sequence per repository**, and cite the number wherever a round's outcome
lands: the fix's commit, the backlog row, the merge, the release record. (`2026-10-22`, three
sequences ran on one day, so "round 3" named three different rounds; with one sequence from then
on, over a hundred rounds stayed citable.)

Verify every finding against the code by hand before acting: a cited line number is a claim too.
Re-run the project's tests on your own eyes after every fix — "it says it passes" is a claim, never
a result. A finding that proves wrong is worth writing down as wrong next to the ones that were
right, because that ledger is what makes the next round's hit rate legible.

## How you can tell it worked

The last round came from a fresh reviewer given only the mechanical range and found no introduced finding above Low, no High or Critical of any age is open, and every earlier finding was checked against the code before it was fixed or dismissed.

## Not this skill

Designing something, or arguing a decision through, is `codex-agents` — a peer with standing,
brought in early and iterated with. This skill reviews what was built.

How to brief and verify any delegate is `delegation`; driving Claude Code headless directly, for a
builder or a peer rather than a reviewer, is `claude-agents`.
