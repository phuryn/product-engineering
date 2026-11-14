# The product plan

**What it is for:** the phases and stages that carry the product from its first screen to release and beyond, each with its scope and status. **The status lives here, and only here.**

**Read it** when planning the next stage, when asked what is done or what comes next, and at every release.

**Rules**

- **Phases start from the default stages** (`stages.md`) **or from a capability row** (`capabilities.md`). A product's plan may merge, split or reorder the default stages; its plan wins.
- **Stage skips and deferrals name the owner's decision and return trigger.** A broad go does not waive an unnamed stage. For example: "Owner deferred browser permission proof until the second role exists; resume before that role ships." (`2026-11-14`, an evals product: browser proof stayed "not started", behind later product work, with no owner deferral.)
- **Each stage states its own done-when: what a person can check when it is finished.** The default stages' done-whens are a starting point; write the product's own.
- **State the gate and review cadence where the owner reads it before building.** Default to a full gate at stage end and before every deploying push, with one review series per finished stage. Compare the gate with the applicable `test-harness` contract; a smaller suite set needs the owner's recorded choice, reason and revisit trigger. Apply `document-app` in check mode at each stage's end, beside the review series; it writes nothing. Record any grouped reviews, such as stages 0–6 reviewed together at stage 7; their stage-end checks still run. Per-piece or per-release cadence needs the owner's choice; deploying pushes and releases always need independent review first.
- **Count full gate runs and the review series in each stage's estimate.** Use one full run's measured time, including a run after review fixes when needed. (`2026-11-13`, a coding-agent client: a full gate estimated at 25 to 42 minutes ran 3 to 4 times per delegated piece. One stage's estimate rose from 6 hours to 12.5.)
- **Each stage line names its journeys, specs and evidence for completion.** Include scope, done-when, status and the brief: active while in flight, archived when done (`stage-brief.md`). At stage end, mark it done against its done-when or state what keeps it open. List the journeys it changes and their committed end-to-end specs; stages adding no journey say so. (`2026-11-14`, an evals product: "click-through pending" survived for weeks while later stages proceeded; none was closed against its done-when.)
- **The status lives here.** The product section of the agent instructions carries at most three lines of it, with a link back.
- **The narrative of what each release shipped** — what it contained, what its review rounds and gates found — **moves to the release history at the next release.** The rules a release taught go into the agent instructions; the story does not.
- **Planned capabilities stay explicitly planned.** A row that is proposed or in flight is never written as though it exists.

## Skeleton — copy from here

```markdown
# Product plan

The phases and stages that carry the product from its first screen to release and beyond, each with its scope and status. Read it when planning the next stage, when asked what is done or what comes next, and at every release. **The status lives here.** The product section of the agent instructions carries at most three lines of it with a link back, and the narrative of what each release shipped moves to <release history path> at the next release.

## Status

<One short paragraph: the current phase and stage, what is in production, what is not, and what is waiting on whom. Planned capabilities stay explicitly planned.>

Cadence: <full gate at stage end and before deploying pushes; one review series per finished stage, with any agreed grouping; document-app check mode and plan-status check at every stage end>. Contract: <applicable suites; any owner-chosen omissions, reason and revisit trigger>. One full gate run: <measured duration>.

## Phases

### Phase 1 — <scope>

- <stage> — <scope>. Journeys → specs: <flows-doc journeys and committed end-to-end spec paths, or none changed>. Done when: <what a person can check>. Status: <not started | in flight (what keeps it open) | done (date, evidence) | deferred (owner decision, return trigger)>. Brief: <active or archived path>.
- <stage> — …

### Phase 2 — <scope>

- …
```

## A filled stage line, by kind

The first real slice — sign-in landing on the member home, workspaces, a host's rooms, the public room page, questions and upvotes.
Journeys → specs: sign-in and room ownership → `tests/e2e/rooms.auth.spec.ts`; anonymous participation → `tests/e2e/participation.spec.ts`.
Done when: hosts cannot see each other's rooms; anonymous phone users can ask and upvote once; submitted `<script>` renders as text.
The signed-in suite passes twice consecutively, the full gate passes, and the five core docs describe the slice.
Status: done (<date>, <gate log>, <docs check>, <owner click-through>). Brief: <archived brief>.
