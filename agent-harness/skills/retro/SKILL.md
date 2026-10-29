---
name: retro
description: "Build a session's learnings into the setup: its friction, what went wrong and why, then an improved instruction, route, hook or script, verified, or 'no setup change warranted'. Started by name only: /agent-harness:retro in Claude Code, $agent-harness:retro in Codex."
argument-hint: "<optional: the friction you noticed>"
disable-model-invocation: true
---

# Retro — a session's learnings, built into your setup

At the end of a session, before its context goes: what slowed it down or went wrong, why, and what change to the agent's setup stops it happening again. The output is fixes made and checked, not a list of lessons.

## Invocation

```
/agent-harness:retro                             Claude Code, plugin installed
/agent-harness:retro it ran the tests against the wrong server twice
$agent-harness:retro                             Codex, plugin installed
/retro   ·   $retro                              the skill folder copied into a repository
```

## Steps

### 1. List what actually happened

From this session only, each item with the moment it happened:

- the owner corrected the agent (quote the correction);
- the agent missed a rule it had;
- work was done twice, or undone;
- an assumption turned out wrong;
- a tool, script or command failed, or needed a workaround;
- the owner waited on something the agent could have done.

Leave out what went fine and what is only a guess about the future. **Evidence, not new rules**: an item with no moment behind it is not one.

### 2. Find the cause of each

| Cause | What it looks like | The fix goes in |
|---|---|---|
| **Missing** | nothing told the agent | the entry file when every session needs it; otherwise the file the agent reads at the moment the rule must change a decision, with a router row for that moment (§ 3) |
| **Present but not met** | the rule existed and the agent didn't apply it when it mattered | the route to it (the instructions' index of what to read when), or code |
| **A tool gap** | a script, check or wrapper was missing or wrong | the tool |
| **A skill's advice** | a skill from a plugin or a collection said something wrong, or left a step out | the project's own agent instructions, naming the skill and what to do instead (§ 3) |
| **A one-off** | it won't recur | nowhere: say so |

### 3. Fix it, code first

In order of preference:

1. **Code:** a script, a hook, a validation, a required argument, a test. If compliance depends on an agent remembering a sentence at the moment it matters, prose will lose. (`2026-06-15`, an agent-run repository: a two-line bug in a notification script was answered with a written convention; five weeks later the same bug killed a scheduled job for five days. Writing it down felt like fixing it.) Hooks and permission rules: the `guardrail-hooks` skill.
2. **An existing instruction or route, improved:** reword the rule that was misread, or move it to where the agent will see it at the moment it applies. Replace or tighten before adding. Removing a rule's text is the owner's: the agent tightens a rule's wording without dropping a condition, an exception or its receipt, moves it to its fire point with a pointer left behind (a move, not a removal), or adds the test or hook that holds it, and proposes the removal. How instruction files are shaped: the `agent-instructions` skill.

   **Where a learning lands.** The entry file (`AGENTS.md`, or the project's own name for it) holds what every session needs. The rest goes in the file the agent reads when the rule must change a decision (its fire point, not its topic home), usually the file of the area that task touches, with a line in the entry file's index naming when to read it. That index has the agent re-read an area's file at the start of every task that touches the area, not once a session: after a compaction or a long session the earlier read is gone. If the router doesn't yet say to re-read at every task, add that sentence. Each file stays within its word budget, and the rule carries its receipt and a review date (`agent-instructions`, budgets).
3. **A new rule**, only when the session gave it a receipt: the date and what happened.

Make each reversible fix in the repository and **verify it**: run the hook on a sample that must trigger and one that must not; open the route where the agent will read it; run the script. A fix that wasn't checked is reported as unchecked. A change outside the repository (the user's own settings or global instructions) is proposed with its exact text, not made, unless the owner says so.

**When the friction came from a skill**, its fix goes in the project's own agent instructions, where the agent reads it when that skill is in use (the router row for the moment the skill runs, or the entry file when it can fire in any task): a plugin's installed copy sits outside the repository, and a skill copied into it is overwritten by its next update, so an edit to either is lost. Then draft the change for the skill's source repository, the one its plugin or copy came from: what the skill says, what happened (the receipt), and the replacement text, for the owner to file as an issue there. Write it the way that repository's skills are written: the product named by kind, and no names, ids, hostnames, paths, account names or values from the session, since the repository is usually public.

### 4. Report

One line per item: what happened, the cause, the fix and how it was verified. When nothing deserves a change, **"no setup change warranted"** is a valid result, and better than a rule that will never fire.

Don't gate what the owner wouldn't want to click for: a guard that asks too often trains a reflexive yes. (`2026-10-12`: a one-way-door hook that also gated routine commands fired on a heredoc that merely mentioned one, the owner said "I don't want those questions", and it was narrowed the same day.)

## How you can tell it worked

Each fix names the moment it came from and was checked where it applies, and the next session doesn't hit the same friction.
