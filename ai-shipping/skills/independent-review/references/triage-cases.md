# Triage for specific findings and fixes

## Layout and performance claims

**A layout or performance claim is settled on the running build, not by re-reading the file — in either direction.** Stylesheet arithmetic may be right while the conclusion is false. A flex item's automatic minimum is its content; cells wider on paper than their container can shrink rather than overflow. "Obviously it shrinks" is as speculative as "obviously it overflows": measure before accepting or rejecting. Measure visible text against neighbours in the same column, not the named container. The defect itself can produce matching box edges. Measure performance on both builds, with the baseline built from `HEAD` in its own worktree. Let the numbers retire the fix.

## Clustered or recurring findings

**When findings cluster, look for one false premise underneath before fixing any of them.**

**When one mechanism draws findings two rounds running, stop patching it.** Repeated inverse defects in one area mean the design is wrong. Before the next round, choose one option in writing:

- Cut it: revert to before the first fix, then ask once what signal the design is missing.
- **Redesign it once.** Write the redesign before building it. It earns that attempt only by removing machinery. A redesign more elaborate than what it replaces repeats the problem. There is no third design: if the redesign added machinery, or the next round finds another finding above Low in the same mechanism, the choice goes to the owner as cut or pause.
- Pause it: when one surface keeps drawing new Highs while the rest of the change is clean, propose to the owner, at the second such round, that it ships behind a switch that is off by default, its open findings in the backlog with the trigger that reopens them, and the next round scoped to what is reachable with it off.

Scale this by whether the work was requested. Apply it hardest to unrequested hardening, lightest to a feature the owner asked for by name.

## Harms tied to the actor or the surface

When a rule hides information from product users, grade further probes by harm to an honest user. A probe usable only by someone deliberately defeating their own measurement is Low. They hide information from themselves, then seek it out.

**When a repair writes a field that says who decided, scope it by the subject** (this participant, this item), never by the rows' current state. A state filter skips exactly the rows another actor already decided.

**When the actor is an attacker, ask whether the finding adds a capability the attacker does not already have in that position.** A mechanism granting nothing new is a description, not a vulnerability; question 2 in `SKILL.md` § Triage passes too easily here. Watch for reasoning from one entry point without reading neighbouring rows in the permission table.

**Improve the average; the exception is the person's work.** Polish serves the case most people meet, letting the rest degrade honestly with geometry intact. Use a same-size placeholder so nothing jumps when the real thing arrives. Anything losing or duplicating what a person made gets full treatment, however rare.

## Choosing the repair

**A fix has a price, and the price compounds.** A confirmed defect is still a decision. Watch for rounds getting narrower, each trigger needing more actors or more precise interleaving. That finds what code permits rather than what users hit. Ask aloud what the fix costs to understand next year, by someone who was not here. State the residue's price plainly. If acceptable, write that down and stop. Ask whether the fix replaces a mechanism or adds one. Replacement is usually right; a special case per round compounds the problem.

**Accepting a finding is a legitimate outcome.** A rarely-wrong rule somebody can hold in their head beats an always-right one nobody can.

**Prefer removing the rare case to supporting it.** Constrain input, refuse the state, drop the option or choose a default that cannot produce it. An unreachable case needs no code, test or comment and cannot interact with the next fix. Ask whether it must exist before writing its branch. Only then weigh fixing against accepting the residue.

**Beware the fix that opens a door.** Two conditions right alone can be wrong together. Continue the loop past the fix that felt final.

**Fix the class, not the instance.** When a finding resembles an earlier one, say so in the next brief and ask for the audit.

## Copy, docs and platform changes

**When a round changes one user-facing sentence, read its neighbours and the assertions around its pin.** A repair can distract from a nearby claim it just made false.

**Search every doc when a state they all describe changes.** When production exists or a feature goes live, find old-state phrases and fix them in one pass. Do not stop at the line the round named. When a rule is repealed, find sentences that argued for it: comments, fixtures and doc paragraphs. Ask what each still holds up.

**Repair a drifted pair by copying the sentence that is right into the place that is wrong.** Never write a third version; pin their agreement in the same change.

**When a repair delegates behaviour to the platform, enumerate what the old code decided.** A deleted handler takes its judgement with it; the diff shows only deletion. When replacing a control, inspect its odd attributes: `aria-disabled` where `disabled` would do, or a seemingly redundant handler. Grep deleted lines for the comment arguing for them.

## Planning ingest, queue and concurrency work

**Budget for a fix commit's own round in ingest, queue and concurrency code.** When planning, allow for that tendency.
