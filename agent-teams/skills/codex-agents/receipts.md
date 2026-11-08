# codex-agents: receipts

Each heading is a rule from `SKILL.md`, with the case that taught it.

## Delegate only what is worth the hand-off; the test is size, not time.

- `2026-09-22`, a builder sat twelve minutes on a fifteen-line change with zero writes and a clean tree.

## Pass it on every build dispatch, not only the ones you think are new sessions.

- `2026-09-16`: a round meant to fix twelve failing tests resumed as a new session, ran read-only, and reported a decision with no diff behind it.

## Leave sandboxed builds uncommitted and ask for a commit-message handoff.

- `2026-10-23`, a monitoring product: four worktree builds came back uncommitted, three of them quoting the `index.lock` error; other platforms not tested here.

## Name `$app-stack:ui-design` in a build that adds or changes screens.

- `2026-11-03`, an evals product: Codex, with no pack installed, built screens without the method, and the owner's click-through found five layout bugs. Once the pack was installed, a headless `codex exec` loaded `$app-stack:ui-design`, codex-cli 0.166.0.

## A usage limit makes the builder unavailable, as a missing CLI does.

- `2026-10-22`: the reset was 90 minutes away, and the session agent built two stages with its own subagents rather than wait.

## A resume does not keep the session's model.

- `2026-10-01`: a resumed session came back on the config default, and nothing failed to say so.

## Use the configured binary, installed CLI, then the extension bundle.

- `2026-10-22`: the extension's bundle was a 0.155 alpha without `codex-code-mode-host.exe`, and every tool call of a build round failed before it ran, with no file changed.
