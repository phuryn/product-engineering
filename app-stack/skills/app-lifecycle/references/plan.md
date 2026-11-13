# The product plan

**What it is for:** the phases and stages that carry the product from its first screen to release and beyond, each with its scope and status. **The status lives here, and only here.**

**Read it** when planning the next stage, when asked what is done or what comes next, and at every release.

**Rules**

- **Phases start from the default stages** (`stages.md`) **or from a capability row** (`capabilities.md`). A product's plan may merge, split or reorder the default stages; its plan wins.
- **Each stage states its own done-when: what a person can check when it is finished.** The default stages' done-whens are a starting point; write the product's own.
- **State the gate and review cadence where the owner reads it before building.** Default to one full gate and one review series per finished stage (`test-harness` § The gate; `independent-review` § When). Record any grouped stages, such as this lifecycle's stages 0–6 reviewed together in stage 7. Per-piece or per-release cadence needs the owner's choice; deploying pushes and releases always need independent review first.
- **Count full gate runs and the review series in each stage's estimate.** Use one full run's measured time, including a run after review fixes when needed. (`2026-11-13`, a coding-agent client: a full gate estimated at 25 to 42 minutes ran 3 to 4 times per delegated piece. One stage's estimate rose from 6 hours to 12.5.)
- **One line per stage:** its scope, its status, and its brief — the active stage brief while it is in flight, the archived brief once it is done (`stage-brief.md`).
- **The status lives here.** The product section of the agent instructions carries at most three lines of it, with a link back.
- **The narrative of what each release shipped** — what it contained, what its review rounds and gates found — **moves to the release history at the next release.** The rules a release taught go into the agent instructions; the story does not.
- **Planned capabilities stay explicitly planned.** A row that is proposed or in flight is never written as though it exists.

## Skeleton — copy from here

```markdown
# Product plan

The phases and stages that carry the product from its first screen to release and beyond, each with its scope and status. Read it when planning the next stage, when asked what is done or what comes next, and at every release. **The status lives here.** The product section of the agent instructions carries at most three lines of it with a link back, and the narrative of what each release shipped moves to <release history path> at the next release.

## Status

<One short paragraph: the current phase and stage, what is in production, what is not, and what is waiting on whom. Planned capabilities stay explicitly planned.>

Cadence: <full gate and one review series per finished stage; any agreed grouping or owner-chosen exception>. One full gate run: <measured duration>.

## Phases

### Phase 1 — <scope>

- **<stage>** — <scope>. Done when: <what a person can check>. Status: <not started | in flight | done (date)>. Brief: <active brief path, or archived brief path once done>.
- **<stage>** — …

### Phase 2 — <scope>

- …
```

## A filled stage line, by kind

- **The first real slice** — sign-in landing on the member home, workspaces, a host's own rooms, the public room page, questions and upvotes. Done when: two hosts of different workspaces can't see each other's rooms; a participant on a phone, with no account, can ask and upvote and is refused a second upvote; `<script>` submitted as a question renders as text; the gate is green. Status: done (date). Brief: the archived brief.
