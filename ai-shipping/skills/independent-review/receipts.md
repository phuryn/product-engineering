# independent-review: receipts

Each heading is a rule from `SKILL.md`, with the case that taught it.

## a repository ranks its reviewers; it cannot rule out a review.

- `2026-11-06`, owner: "Of course the same family when there is no other".

## Review again after fixing anything a round found.

- `2026-10-22` to `24`, a monitoring product: in about 140 rounds, commit messages name at least seven chains in which a round's finding was caused by the previous round's fix. In one, keeping an incident already open folded a real outage into a seeded test incident, so uptime never dipped; the next round caught it.

## Read that status for what does not belong, too.

- `2026-10-11`, 364 data files left untracked swelled a round's subject to 89k lines; the round was stopped, the directory deleted and the round run again.

## Split by surface when the history does not partition.

- `2026-10-22`, a monitoring product's first whole-range review, split by surface: the rounds on the public surfaces and on data and screens found a paused component drawn green on the public page and an address that handed its password to every visitor. Three area rounds started at once had all read the last brief written, which is why the wrapper names its prompt and subject files per run.

## Scope the subject by what a reviewer must read, not by file count, and keep generated prose out of it.

- `2026-09-17`, one commit reviewed as code completed; the same commit reviewed with its docs exhausted the round.

## An installed Grok can still be out of usage.

- `2026-10-31`: a signed-in Grok CLI answered `402 usage balance exhausted`.

## A short clean round is a failed round.

- `2026-09-08`: two such rounds were read as clean before a third, run properly, found a real defect in the commit both had "cleared".

## A round can fail by running out of room, leaving the same short output.

- `2026-09-17`, a round exhausted context across 77 files and stopped after one real finding.

## Never remove a worktree whose `node_modules` links to another checkout.

- `2026-10-02`, a temporary worktree's junction; `npm ci` restored the main checkout.

## A push can have side effects beyond the deploy.

- `2026-09-16`, a migration that could not have applied cleanly was moved out of the migrations directory for exactly this reason.
- `2026-10-22`, a review found a migration revoking two worker boxes' table grants sitting in the migrations directory while both still ran the build that needed them, so the routine push would have applied it early.

## does anything cross a line the person cares about?

- `2026-09-03`, a costly fix was reverted after the owner rejected its claimed High severity.

## A layout or performance claim is settled on the running build, not by re-reading the file — in either direction.

- `2026-09-20`, a reported overflow measured 16px clear at ten widths.
- `2026-09-21`, a full-bleed card's edges matched its neighbours' while its text started at x=14 and theirs at 30.
- `2026-09-25`, a proposed layout-shift fix addressed 0.002 of shift while the real source was a poll.

## When findings cluster, look for one false premise underneath before fixing any of them.

- `Undated`: Three findings in one review came from a single wrong assumption about the product.

## Rank by what it costs this product, not by where it sits in the list.

- `2026-11-04`, an evals product: rounds 27–29 each rated another way to distinguish held-out labels High; two cycles of patches opened the next probe before one simpler rule removed the surface.

## Prefer removing the rare case to supporting it.

- `2026-10-10`, four rounds each patched the last round's guard on a recorded marker; computing the value instead of recording it ended them.
- `2026-10-22`, four rounds each found another encoding in which a stored secret header slipped past a masker; sending that header only to the exact address it was saved for ended them.

## Beware the fix that opens a door.

- `Undated`: One round's guard enabled the next round's theft, and a later guard silently reinstated a defect two rounds older, because two conditions that were each right alone were wrong together. Nothing caught it — not the suite, not the next round. Which is exactly why the loop continues past the fix that felt final.

## When a repair writes a field that says who decided, scope it by the subject

- `2026-09-20`, a live Q&A product, two rounds: a ban's repair re-stamped who hid questions but skipped those the AI moderator had already hidden, leaving the wrong actor.

## When the actor is an attacker, ask whether the finding adds a capability the attacker does not already have in that position.

- `2026-09-04`, a remote-control product: a compromised relay could inject a credential into a desktop machine, which was true step by step; it was gated, the gate needed a fix of its own, and both were reverted once someone read the same table and saw that relay could already send prompts and approve the tool calls they produce. The injected credential granted strictly less.

## Improve the average; the exception is the person's work.

- `2026-08-21`, a transcript cache grew four negotiating mechanisms over one question the host already answered.

## Read a clean round's argument, not only its verdict.

- `2026-09-21`, a live Q&A product: a clean round's citation exposed a neighbouring reopen that left the opened timestamp alone.

## When a round changes one user-facing sentence, read its neighbours and the assertions around its pin.

- `2026-09-17`, three consecutive rounds each found another false sentence beside the previous fix.

## Search every doc when a state they all describe changes.

- `2026-10-24`, a monitoring product: eight rounds in one day each found more lines still describing production as unbuilt; the first sweep by phrase came at the fifth, and later rounds still found stragglers.
- `2026-09-20`, a live Q&A product: a comment arguing for a repealed rule kept a dead fixture item alive, hiding an uncovered screen.

## Repair a drifted pair by copying the sentence that is right into the place that is wrong.

- `2026-09-21`, a live Q&A product, two rounds: rewriting both documents' versions of one rule made it wrong in a new way.

## When a repair delegates behaviour to the platform, enumerate what the old code decided.

- `2026-09-17`, native dialog dismissal lost the guard against closing during an in-flight action.
- `2026-09-20`, a live Q&A product: replacing an `aria-disabled` control with a disabled one lost the native dialog's focus return.

## Stop at no INTRODUCED finding above Low and no High or Critical of any age.

- `2026-10-24`: a monitoring product's five production promotions each closed on such a round, after 9, 5, 1, 2 and 1 rounds. The first, the whole product, took the most; each later one reviewed only its own commits.

## When one mechanism draws findings two rounds running, stop patching it.

- `2026-07-31`, again `2026-08-17`: Machinery added in response to findings produced a new defect in nearly every later round, each fix creating its own inverse; four mechanisms were built and then deleted.
- `2026-11-01`, an evals product: one fallback took six shapes over rounds 5 to 12, each round's Medium introduced by the fix before it; then five rounds in a row found new Highs in one surface, paid production sampling, while the rest was clean, and pausing it behind an off-by-default switch ended the loop three rounds after the pause was first due.
- `2026-10-29` and `30`, this collection's own release review: a landing page's analytics drew findings in eleven of 23 rounds, three of them running at the start, and the loop closed three rounds after the tag's address rewrite came out.
- `Undated`: a feature the owner asked for by name, which this rule once abandoned wrongly.

## Redesign it once.

- `2026-08-20`: a liveness probe that deleted a timeout no value could make right.

## Budget for a fix commit's own round in ingest, queue and concurrency code.

- `2026-11-01`, the same product (an evals product): rounds 2 to 4 of its first slice each found a Medium the previous round's fix introduced: an index that no longer matched, a retry split the wrong way round, a cap that moved a trace's clock.

## Record pre-existing findings with their deferral reason and a revisit trigger.

- `2026-10-24`: a Low deferred "until a paid-only location goes live" was closed the day that location went live.

## Number rounds in one sequence per repository.

- `2026-10-22`, three sequences ran on one day, so "round 3" named three different rounds; with one sequence from then on, over a hundred rounds stayed citable.
