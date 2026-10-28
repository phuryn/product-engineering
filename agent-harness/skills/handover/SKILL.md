---
name: handover
description: "Write the handover a fresh session starts from: the objective, what is true now, the evidence actually obtained, what is left, the open decisions and the next concrete action, reconciled with the disk first. Started by name only: /agent-harness:handover in Claude Code, $agent-harness:handover in Codex."
argument-hint: "<optional: what the next session will do>"
disable-model-invocation: true
---

# Handover — what the next session starts from

The session is ending, or its context is: the work continues tomorrow, in a fresh session, or with another agent. This writes the one note the next session reads first, so it starts from what is true rather than from what this session remembers.

## Invocation

```
/agent-harness:handover                          Claude Code, plugin installed
/agent-harness:handover the next session finishes the billing stage
$agent-harness:handover                          Codex, plugin installed
/handover   ·   $handover                        the skill folder copied into a repository
```

## Steps

### 1. Reconcile with reality first

Before writing a word, check what this session believes against what is there:

- **The disk:** `git status`, the branch, the commits made this session, the files the work touched. Uncommitted work is named as uncommitted.
- **What is running:** background jobs, servers, watchers and builds this session started. Each is still running, finished (with its exit code, read from its log), or gone.
- **The project's own state files:** its plan's status, a status board, a backlog, an earlier handover. A line there that the disk contradicts is corrected, not copied.

An inherited report is a claim, this session's own memory included. (`2026-09-16`: a handoff that read as verified had missed production migrations not yet applied.)

### 2. Write what the next session needs

| Section | Holds |
|---|---|
| **Objective** | what the work is for, in a line, and who asked |
| **Where it stands** | what is true now: built, committed, pushed, deployed, each said plainly |
| **Evidence** | what was actually run and observed: the command, its exit code, the number, the verdict. Not what was intended. Anything unverified says so |
| **Left to do** | in order, each small enough to start on |
| **Open decisions** | each with its options, a recommendation, and whose decision it is |
| **Where things are** | branches, worktrees, files, logs, URLs, processes still running and how to stop them |
| **Next action** | one concrete first step: a command to run, a file to open. Never "continue" |

Keep it short enough to stay true. The evidence is the part that costs most to lose: a re-run experiment costs money, and a number restated from memory is how a wrong one reaches the owner.

### 3. Put it where the project keeps such things

The project's own convention first: its status board, its plan's status lines, a handoff file it already has. With none, one `HANDOVER.md` at the repository root, rewritten in place each time (it says what is true now, not the history). For a short session, a few lines are enough; work that runs for hours, across several sessions or with jobs in the background wants the `flight-deck` skill's status board and log instead of a single note.

Nothing secret goes in it: no keys, tokens, passwords or connection strings, only where they are kept.

### 4. Tell the owner how to start the next session

End with the one line to give the next session, for example: *Read `HANDOVER.md` and start from its next action.* And list anything left running.

## How you can tell it worked

A fresh session given only the note can say what the work is for, what is verified and what is not, and run the next action without asking what happened.
