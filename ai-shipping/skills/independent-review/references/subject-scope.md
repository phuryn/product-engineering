# Choosing and preparing the review subject

## Before the first release or when history began elsewhere

**Before the first release, review the whole history with `--subject HEAD`.** Earlier phase series cover their phases; they do not replace this whole-product review. The wrapper writes every commit's author and message, every file `HEAD` holds, and every line its history removed. Include the first commit: a push sends every commit, and `<first commit>..HEAD` would omit it. A clone or fork whose history began in another repository uses the same `--subject HEAD`. The source repository's tags and branches are not this product's releases. Before any release, nothing is live yet. The brief therefore marks every finding INTRODUCED, including code that came with the history.

## Dividing an oversized subject

A range too large for one round is split, never shortened, in one of two ways:

- **Split by commits when the history falls into stages.** Give each round a contiguous slice and the rest of the range as context, oldest first. Each later round reads earlier slices for interactions. This fits a few build stages.
- **Split by surface when the history does not partition.** This fits a first release covering the whole product, or commits that each touch everything. Each round takes the whole range and reads its assigned area in full, with other areas named as context. Examples are public surfaces; data, permissions and money; and member screens. Together, the areas cover every changed file. Area rounds read one still snapshot and run in parallel, each with its own brief and output file so concurrent rounds do not all read the last brief written.

## Untracked files and generated docs

The wrapper inlines every untracked file under 200 KB, including its content. The cap is per file. A directory of small generated files therefore goes in whole: copied data, fixtures, scratch output or build artefacts without ignore rules. The turn cap rises to fit it. For anything outside the change, delete only what this session generated; otherwise `.gitignore` it or ask the owner before the round. A subject much longer than the diff's `--stat` suggests usually signals this. The wrapper warns when untracked files add more than 20,000 lines or most of a subject over 5,000, and never refuses.

Give generated docs as context for code questions, not review subject; prose can exhaust a round that fits the code and tests.

## Coordinator notes

**Keep coordinator notes out of the review subject until its series closes.** Suspected defects and running triage steer a fresh reviewer. Commit those notes only after the series' final code-clearing round, or keep them outside the repository until the series closes.

## Merges, removed code and excluded paths

**A range that contains a merge also carries the range's cumulative diff.** `git log -p` shows merge commits without their diffs, omitting conflict resolutions or edits inside merges. The wrapper adds the cumulative diff for `A..B` and `<sha>^!`. A bare ref such as `HEAD` needs none: its subject includes every held file and every line removed in history. It warns on any other range shape. Each commit's change appears again, nearly doubling the subject; size the round accordingly.

**Send the net diff when a range wrote code and later removed it.** With an `A..B` or `<sha>^!` subject, `--net` keeps the one-line commit list and replaces each commit's patch with the range's cumulative diff and every line its history removed, which a push still sends. `--exclude <glob>`, repeatable, leaves out paths that are not the change, such as working notes from earlier series.

## Phase size and review cadence

Size phases for agents: a few hours of builder turns, ending in something clickable and deployable. A first version usually needs two to four phases. A sprint is an analogy, not a human timetable. A stage is one consistent, testable piece inside a phase; a delegated piece is part of a stage.

- **Choose the split and cadence, and state them before building.** The coordinator chooses what agents can handle and what improves quality without needless delay. The plan message itself names the phase split, review cadence and rough builder-hour estimate. Repository instructions or the owner may set another cadence; record it in the plan. Findings land later on a larger diff; split an oversized subject by stages' commits or area, never shorten it (`SKILL.md` § The subject).

## Before the first push or a push with side effects

- **The first push goes only where the owner named.** Every URL from `git remote get-url --push --all origin | sed -E 's#//[^/@]*@#//#'` must name that repository. The `sed` removes any username or token. If any URL differs, push nothing and ask.

**A push can have side effects beyond the deploy.** An integration may apply migrations, or a hook may publish. Complete prerequisites before pushing, such as applying and verifying migrations by hand, so the push finds nothing pending. A production migration also waits for the owner's go; apply `release-gate`. Keep files you do not intend to run out of any integration's pickup location.
