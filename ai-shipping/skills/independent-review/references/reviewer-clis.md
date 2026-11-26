# Reviewer CLI setup and diagnostics

Use this reference to check what a specific CLI isolates, prepare a manual round, or diagnose a failed one. The normal command and the evidence needed to accept a round are in `SKILL.md` section Running it.

## What each reviewer can still see

- A fresh Codex session in a read-only sandbox excludes user config and its MCP servers, execpolicy rules, connected apps, plugins, tool suggestions, web search, image generation, memory and saved sessions. A flag disables hooks. Repository and `CODEX_HOME` `AGENTS.md`, bundled skills, agent tools and administrator additions remain. Name them in the report (the Reviewer section of `references/codex.md` in the `delegation` skill points to the manual checks).
- A fresh headless Claude Code session uses read-only tools. It has no settings, hooks, plugins, MCP servers, auto-memory or saved session, starting from the repository and brief alone.
- Grok runs with read-only tools. Its memory, managed MCP servers, and Claude, Cursor and Codex compatibility, including session reading, are off for the run. The wrapper reads whatever still loads from `grok inspect` and prints it for the report. In a trusted folder, that includes project instructions and a gitignored `CLAUDE.local.md`. A review worktree of the snapshot does not hold that file.

A sandbox flag alone is insufficient. In Codex, `-s read-only` binds only shell commands; user configuration can add tools acting outside it (Codex CLI 0.159.0, observed `2026-10-29`). Ignoring user config does not remove connected apps, plugins or web search (Codex CLI 0.166.0, observed `2026-11-14`). Leave that configuration out and switch those features off by name; apply the Reviewer section of `references/codex.md` in the `delegation` skill.

## Wrapper flags and paging

**Use the repository's runnable fallback when the default reviewer cannot run.** `--reviewer auto` defaults to the first installed of Codex, Claude Code and Grok. Choose `--reviewer codex`, `claude` or `grok` explicitly. Codex runs `exec --json --ephemeral --ignore-user-config --ignore-rules -s read-only --disable apps --disable plugins --disable tool_suggest --disable image_generation --disable memories --disable hooks -c web_search=disabled`. It passes `--effort` as `model_reasoning_effort` (`xhigh` by default). Its event stream fails a round with no successful command, a completed outside MCP call, a web search, completed file changes, a missing report or events, or a failed turn. Pass the review model the user confirmed (the `delegation` skill's Codex reference) with `--model`, because ignoring user config also omits your configured model. On Windows, `--windows-sandbox elevated|unelevated` explicitly overrides the mode; absent that flag, the wrapper restores `[windows].sandbox` from config. It stops with setup instructions when neither supplies a mode (observed `2026-11-16`, Codex CLI 0.169.0). Claude runs `claude -p` with `--restricted`, `--tools Read,Grep,Glob`, `--strict-mcp-config`, `--no-session-persistence`, `--effort max` and `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. Measured on 2026-10-10: without that variable, a headless session loads the project's memory index holding builder notes. With these flags, no project instructions, personal notes, memory or skills list was in its context.

- `2026-11-16`, Codex CLI 0.169.0 on Windows: an elevated review timed out after 60 minutes with zero commands. The unelevated round completed in about 15 minutes. The wrapper therefore accepts an explicit Windows mode override; absence keeps config lookup.

Grok and Claude Code have no shell; Codex has a read-only shell. The wrapper writes the range's log and diffs, then everything uncommitted, to a never-committed file inside the git directory. It lists untracked files individually, with their content. It gives the reviewer the length and paging instructions: some file tools return at most 1,000 lines and may not say there are more. For Grok, it raises the turn cap when paging the subject needs more turns. The Codex and Claude Code runs have no turn cap; `--max-turns` does not apply to them.

## Selecting and running a fallback

When none of the repository's named reviewers can run, use the wrapper's reviewer without asking. If no other family can run, use a fresh session of the builder's family. Never use the building session or skip review. Interpret "a model never reviews its own family's work" as "prefer another family". Apply `agent-instructions` to rewrite it accordingly and record owner choices and their precedence.

When a named reviewer cannot meet the isolation bar in `SKILL.md`, use the product's recorded fallback if it can, without asking. Otherwise use the fallback above, without asking. Name the actual reviewer and why it replaced the named one in the report.

Pick `--reviewer codex`, `claude` or `grok` as needed, and pass the confirmed review model with `--model`. This file covers each CLI's flags, Windows setup and the event checks.

**An installed reviewer can still be out of usage.** Exit 3 prints the same round with the next installed reviewer, or the `--subject-only` route if none is installed. Use the repository's qualifying fallback and its model, or use the printed fallback without asking. A fresh session of the builder's family can run when no other family can. Record the reviewer and reason (`SKILL.md` § Reviewer selection and isolation).

**With none of the three CLIs, give the wrapper's prompt to a fresh separate process.** Use `--subject-only` with `--brief`, `--cwd` and `--subject` as in `SKILL.md` § Running it. It writes the subject and prompt into the git directory and prints their paths. The prompt contains the brief plus paging instructions. Give it to a fresh read-only session of your agent, started as a separate process in the checkout under review. Never use a subagent, fork or resumed session of this one. Require read-only tools, no MCP servers or connectors, high reasoning effort or above, and memory off where it allows. Switch off project and personal instructions where allowed. In a review worktree, the git directory is outside the checkout; give read access there, never write.

Where no fresh session can be started, stop and hand the owner the prompt path. The round has not run until a fresh session answers. Apply the same report and evidence checks as in `SKILL.md` § Running it. Delete both files when the round ends.

## Fallback order

After Codex, the order is Claude Code then Grok. After Claude Code, it's Grok then Codex. After Grok, it's Codex then Claude Code. With no other installed, it prints the `--subject-only` route.

## Diagnosing a round that stops short

A reviewer unable to use its tools, such as Grok without `--always-approve`, can exit 0 after a sentence of preamble. That reads like "found nothing".

**A round can fail by running out of room, leaving the same short output.** Read its log. Memory flushes distinguish context exhaustion from a reviewer that read nothing. Split a large phase subject by its stages' commits or area; never shorten the range. Keep and verify findings emitted before failure.

Use `subject-scope.md` to split an oversized subject.

## Manual runs

**Apply the CLI's reference when running a reviewer by hand.** Apply the Reviewer section of `references/codex.md` in the `delegation` skill for the wrapper's Codex command and its manual checks. Apply the `delegation` skill's Grok reference for Grok's bare call and each wrapper flag's purpose.

**The prompt comes from a file, the working directory is the repository under review, and stdin never waits on a terminal.** Close stdin with `< /dev/null` when the CLI takes the prompt through a file flag. When it reads stdin, as Codex does, pass the prompt file itself. Never leave stdin waiting on a terminal: that hangs without output. Long inline prompts trip permission classifiers.

## Related work

The method holds for any reviewer. Apply the `delegation` skill's Codex, Claude Code or Grok reference to drive its CLI from another agent.

**Bring in a peer early for design or arguing a decision through.** Apply the `delegation` skill's Codex, Claude Code or Grok reference. This skill reviews what was built.

**Use the related skills for CLI mechanics, delegation and reading defects.** Apply the `delegation` skill's Codex, Claude Code or Grok reference to drive its CLI from another agent in any role, including reviewer. Apply the `delegation` skill for briefing and verifying any delegate, and `code-review` for reading code for defects.
