---
name: windows-agent-shell
description: "A coding agent on Windows: Git Bash path rewriting, PowerShell quoting and encoding, CRLF. Use when output comes back garbled, or it works here and breaks there."
---

# Windows agent shell — traps, and the works-here-breaks-there class

A coding agent on Windows runs its commands through Git Bash, PowerShell or cmd, and each one splits arguments, expands characters, converts paths and decodes text differently. A command that is right in one is wrong in another, and the dangerous cases don't fail: they pass with a different meaning. Most of the receipts below cost an hour or more because the failure looked like a code problem.

**The rule under all of them: when something works here and breaks there, suspect the environment you did not measure.** The shell, the CLI's version, the spelling of a path and a file's line endings are part of the invocation. When a config change seems to fix or break something, first check that the invocation was held constant.

Every version-specific line carries the version and date it was observed. Vendors change these monthly; `§ Re-verify` says how to re-test.

## First, know which shell runs the command

- **Claude Code's Bash tool on Windows is Git Bash** (MSYS2). Without Git for Windows it uses PowerShell instead (2.1.120), and with the PowerShell tool enabled PowerShell becomes the primary shell (2.1.126) (changelog, read `2026-10-24`).
- **Shell-form hooks run through Git Bash, or PowerShell when Git Bash is missing**; Cursor runs hook commands through PowerShell; Codex takes a separate `commandWindows`. The `guardrail-hooks` skill has the hook side.
- **Windows PowerShell 5.1 (`powershell.exe`) ships with Windows; PowerShell 7 (`pwsh`) is a separate install and is often absent** (a dev box had only 5.1 on `2026-08-17`, and still on `2026-10-24`). A script or instruction that says `pwsh` fails there.
- **Measure, don't reason:** `python <skill dir>/scripts/probe_argv.py <the same arguments>` in the same shell prints exactly what a program receives, and which encodings its pipes use.

## Paths

1. **Forward slashes, always, in anything a bash shell will read.** Bash treats `\` as an escape: a hook command written `C:\Python313\python.exe` ran as `C:Python313python.exe: command not found`, and every hook errored (`2026-06-22`, the installer of burnstop, an open-source Claude Code plugin). Write `C:/Python313/python.exe`; Windows accepts it. On `2026-08-16` backslashes in Bash commands also fed Claude Code's Windows command analyser and caused permission prompts.
2. **Uppercase the drive letter for any tool that takes its root from the working directory.** `npm --prefix "c:/work/app" test` reported 177 test files failed with "No test suite found", zero tests, exit 1; the identical command with `C:/work/app` passed 4,121 tests in 41 seconds (`2026-08-22`, a VS Code extension on Vitest). It fails loudly and asserts nothing, so it reads as a broken suite. An hour of bisecting worker counts "found" a cliff between 2 and 4 workers that did not exist: every passing run had used a different command shape than every failing one. An earlier session had written the suite down as broken on Windows; it never was.
3. **Git Bash rewrites any argument that starts with `/` into a Windows path** before a native program sees it. `gh api /repos/owner/name` fails with `invalid API endpoint: "C:/Program Files/Git/repos/owner/name"`, and `--flag=/etc/x` arrives as `--flag=C:/Program Files/Git/etc/x` (verified `2026-10-24`, Git 2.49.0, gh 2.100.0). Drop the leading slash (`gh api repos/owner/name`) or set `MSYS_NO_PATHCONV=1` for that command.
4. **Git Bash spells `C:/x` as `/c/x`**, and Windows programs can't open `/c/x`. A hook or script that reads paths out of a command converts them (`/c/x` → `C:/x`). File paths in Claude Code's hook input arrive with backslashes even under Git Bash (docs, read `2026-10-24`): normalize before comparing.
5. **A generated file written with the host's separators must not be tracked.** A mobile project's package manifest is regenerated on every sync with the machine's native separators; the committed Windows copy held `..\..\node_modules\...`, and the other platform's compiler rejected `\.` and `\n` as invalid escapes, so the committed state had never built there (`2026-08-23`). Untrack it, don't commit one OS's copy: the trap is a generated file being tracked at all.
6. **A junction makes a delete reach somewhere else.** `npm --prefix <worktree> install`, run while the shell's working directory was another repository whose package the worktree depended on, created `<worktree>/node_modules/<that package>` as a junction to that checkout (`2026-09-27`). A recursive delete of that `node_modules`, or `git worktree remove --force`, goes through the junction; one already had, taking 577 of 979 packages (before `2026-08-20`). Run installs with the target as the process's working directory, list `node_modules` for junctions before deleting, remove the junction itself first (`rmdir` on the link doesn't follow it), then `git worktree remove` without `--force`.

## Arguments and quoting

1. **Backticks inside `git commit -m "..."` are command substitution.** The backticked words are executed and replaced with their output, usually nothing, and nothing warns you: a commit landed with the code names simply missing from its sentences (recorded `2026-08-30`). See § Commit messages for what to write instead.
2. **PowerShell splits a bare `-c.foo=bar` token in two.** A release build passed `-c.extraMetadata.name=value` to a desktop app's packager; on the Windows leg, PowerShell 7 delivered `-c` and `.extraMetadata.name=value`, the packager read `-c` as its config-file flag and died on a missing file, while macOS passed the token intact (`2026-08-24`). Windows PowerShell 5.1 does the same (`2026-10-24`, 5.1.26100: `["-c", ".a.b=c"]` bare, `["-c.a.b=c"]` quoted). **Quote it**, and pin the quoted spelling with a test. Two lessons beyond the fix: **a matrix can half-break and look finished** (the release, the tag and both stores were green; the `.exe` simply wasn't attached; check the assets, not the run), and **a flag that has never been passed before has never been tested**.
3. **Under `$ErrorActionPreference = "Stop"`, Windows PowerShell 5.1 turns a native program's stderr into a terminating error once stderr is redirected.** An install script aborted on its own success path because the packager printed a warning, and a script that installs into every editor stopped after the first (`2026-08-17`). Reproduced `2026-10-24` (5.1.26100): a program that exits 0 after writing one warning line, called with `2>&1`, ended the script with `NativeCommandError`. Make stderr non-fatal around native calls and judge them by `$LASTEXITCODE`.
4. **In PowerShell, an environment variable set to an empty string is deleted.** `$env:DATABASE_URL = ""` removes it, so a loader such as dotenv fills it back in from `.env`, and a run meant to have no database reaches the configured one; bash's `DATABASE_URL= cmd` passes an empty value instead (`2026-10-23`: a delegated builder's "database-free" test run hit the configured database settings, and it could not say afterwards whether that attempt reached the database; reproduced `2026-10-25`, 5.1.26100). Set a single space when the code trims values to absent, or pass an explicit flag; and when an attempt may have touched a real system, say so in the handoff.
5. **Long PowerShell scripts: launch them from the Bash tool.** Claude Code's PowerShell tool capped a call at 10 minutes, too short for an hour-long release script that would be killed wherever it was, possibly between the tag and the installers (`2026-09-25`). `powershell.exe -NoProfile -ExecutionPolicy Bypass -File <script>` from the Bash tool, with a long timeout, has carried 16-minute runs without interruption.

## Encoding and line endings

1. **Never edit a UTF-8 file through Windows PowerShell 5.1's `Get-Content`.** It decodes with the ANSI code page, so `(Get-Content f -Raw) -replace 'a','b' | Set-Content f -Encoding utf8` gives every `§` a stray `Â` in front and turns every `—` into the three characters `â` `€` `”`; `-Encoding utf8` on the write is what makes it look safe, and the damage is on the read. It corrupted 111 characters in a project's instructions file that was committed, pushed and packaged into a published extension, caught only because a four-number change showed 132 changed lines (`2026-07-31`). Reproduced `2026-10-24` (5.1.26100), which also showed the write adding a UTF-8 BOM and a trailing CRLF. The same session posted mojibake into a public issue via `gh issue close N --comment (Get-Content f.md -Raw)`.
   - Edit text with the agent's own edit tool; pass text to CLIs as a file (`--body-file`, `-F body=@file`), which reads bytes.
   - Detect: `python <skill dir>/scripts/check_text.py <files>` flags mojibake, a BOM, CRLF and invalid UTF-8.
   - Repair: restore the last good version (`git checkout <good-ref> -- <file>`) and redo the edit. Don't reverse the double encoding: CP1252's 0x80–0x9F range doesn't round-trip, so a reversal loses characters.
2. **Python on Windows reads and writes pipes in the ANSI code page** (`cp1250` or `cp1252` by locale; `utf-8` with `PYTHONUTF8=1`, observed `2026-10-24`, Python 3.13.1). A hook's `§` reached Claude Code's transcript as `�` the same day. In a script that talks over pipes, reconfigure stdout and stderr to UTF-8 and decode stdin as UTF-8 bytes, or set `PYTHONUTF8=1`.
3. **A tool or a delegate can rewrite line endings behind a clean diff.** Nine files came back from a delegated build entirely CRLF in a repository whose `.gitattributes` says `eol=lf`; `core.autocrlf` normalised them on commit, so the diff was clean (403 insertions, 243 deletions) and the working tree was not (`2026-09-23`). Tests that anchor on source text failed with `expected -1 to be greater than 58555`, in a file the batch never touched, and the delegate blamed the checkout instead of its own writes. Detect: `git ls-files --eol | grep w/crlf` for tracked files (it lists working copies whose endings differ from the index; on `2026-10-24` it found 19 such files in a freshly written skills repository), and `check_text.py` for untracked ones; `grep -c $'\r'` is not reliable under Git Bash. Fix: `check_text.py --fix-crlf <files>` changes nothing else.

## Claude Code auto mode on Windows Git Bash: version-specific, with an expiry

**What happened.** Auto mode became the default on native Windows in 2.1.233, and 2.1.232 added a Windows-only static analyser for Git Bash commands. From `2026-08-14`, ordinary read-only commands stopped for a manual click. The analyser ran after the permission decision and downgraded allow to ask, so neither `permissions.allow` nor an `autoMode` entry could clear it. The two upstream issues were closed as fixed in 2.1.233 on `2026-08-20` (its changelog: `cd <dir> && <command> > file` no longer stops; the 2.1.232 changes for Cygwin-style symlinks and `< file` were reverted). Measured on 2.1.233 on `2026-08-16`, chains without a redirect still prompted.

**The rule under the cheat sheet: the analyser must never have to infer anything.** Every path, directory and write target appears literally in the command. Measured `2026-08-16` on 2.1.232/2.1.233:

| Don't | Do instead |
|---|---|
| `cd <dir> && <cmd>` | absolute paths, or the tool's own directory flag (below) |
| `S="<path>"; ... > "$S/out.log"` | the literal path inline |
| a loop writing `"$S/f$i.log"` | the loop in a script, invoked by its literal path |
| `(`, `)` or `=` inside quoted prose (`echo "=== check (x) ==="`) | plain words |
| a heredoc (`git commit -F - <<'EOF'`) | the text in a file, passed by path (§ Commit messages) |
| backslashed paths | forward slashes |
| one command naming more than 8 paths, or over ~10,000 characters | several calls; long briefs in a file |
| `grep`, `cat`, `ls` through Bash | the agent's own search, glob and read tools, which skip the analyser |

`;` instead of `&&` when steps are independent, and one command per call: every extra `&&`, pipe, glob and quoted regex raised the odds.

**Directory flags** are the route for anything that resolves its config from the working directory: `npm --prefix <dir> run <script>` (verified to set the script's own working directory and to survive a nested `npm run`), `git -C <dir>`, `node <absolute script path>`, and `--cwd <dir>` for delegate CLIs. On `2026-08-16` a standalone `cd` that left the session's project root was bounced (`Shell cwd was reset to ...`) on the next call.

**A script is fine when it moves a loop out of the command, never when its purpose is to keep a safety-relevant flag out of what the classifier sees.** It stays on disk and gets read.

**Since then.** On `2026-10-24`, on 2.1.310 in an auto-mode session on Windows 11, `cd <dir> && ls && git log ...`, `mkdir ... && cd ... && curl -o <file> ...` and heredocs fed to `python -` all ran without stopping the agent. The changelog between shows heredoc and compound-command fixes in several releases. **So re-test before carrying the cheat sheet:** run `cd <dir> && sed -n '1,5p' <file>` in auto mode on your version. If it runs clean, drop the workaround half: a rule kept past its cause is superstition, and it uglifies every command for nothing. Three rules stay regardless, because they are correct for other reasons: **directory flags** (`--cwd` keeps a delegate from working in, or resuming a thread from, the wrong repository), **briefs in a file**, and **the dedicated read and search tools**.

Related auto-mode facts that are not Windows-specific (observed `2026-08-16`): `autoMode` is read only from user settings, never from a project's `.claude/settings*.json` (since 2.1.207, so a checked-in repository can't grant itself rules); an `autoMode` array without the literal `"$defaults"` replaces the built-in list instead of adding to it, which for `soft_deny` silently drops force-push and production-deploy protection; `claude auto-mode config` shows the result. When a call is blocked, the agent sees only `Blocked by classifier` (since 2.1.208); `/permissions` → Recently denied shows the real reason.

## Commit messages and other text passed to a CLI

Two facts, both true when observed:

- **The usual fix is a heredoc, `git commit -F -`, never `-m "..."`**, because backticks inside `-m` are command substitution and vanish silently (§ Arguments 1). A heredoc with a quoted delimiter (`<<'EOF'`) passes the text with no expansion at all.
- **On native Windows in auto mode, Claude Code 2.1.232/2.1.233 read heredocs as "expansion obfuscation" and stopped for a manual click** (`2026-08-16`). On 2.1.310 (`2026-10-24`) heredocs ran without stopping.

**What to do: write the message to a file and pass it by path** (`git commit -F <file>`, `gh ... --body-file <file>`, `gh api ... -F body=@<file>`). It is immune to both: the shell expands nothing in it, and an analyser has nothing to infer. Where your version doesn't stop on heredocs, `git commit -F - <<'EOF'` is equally safe. Never `-m` with backticks, and never text that came through PowerShell 5.1's `Get-Content` (§ Encoding 1).

## Works here, breaks there

1. **When you shell out to someone else's CLI, its version on the target machine is the contract.** A feature was built on `gh auth status --json hosts`, measured on the dev box's gh 2.98. The cloud machines it ran on had gh 2.79, from the hosting vendor's base image, where `auth status` has no `--json` (`2026-09-04`). It passed every local test, the type check and the whole gate, and failed on the one surface the feature existed for; it was caught only because someone probed a real machine before accepting the work.
   - Probe the target, not the dev box, before building on a third-party binary. One command on a real machine costs a minute.
   - Prefer the oldest surface that answers the question (`gh api user --jq .login`, which every plausible version has).
   - Branch on the exit code, never on stdout: the failing call printed a JSON error object, so a reader trusting stdout would have reported a user called `{`.
   - Encode the older contract in the test fake: the fake now rejects `--json` the way the old version does.
2. **A new value on an existing message is not additive.** Adding a message *type* is additive: an old receiver doesn't recognise it and drops it. Adding a *value* to an existing field is not, because the old handler has a default branch: a cancel message gained a new provider value, the installed receiver mapped the unknown value to its default provider, and Cancel either did nothing for fifteen minutes or cancelled a different sign-in (`2026-09-04`, caught by an independent review of a commit that called it "additive"). Read what the old receiver does with an unrecognised value: it rejects it (safe), maps it to a default, or half-handles it. The last two need a capability flag, exactly as a new type does.
3. **The dev box's tools are part of what a review can see.** An installer snippet passed locally and in review and failed on Linux CI: GNU coreutils 9.2 and later exit 1 when `mv -n` declines to overwrite, while Git Bash's `mv` exits 0 (`2026-09-25`). The reviewer had run it on the same Windows machine and inherited the old behaviour. Tell a reviewer when the target differs, and make the test reproduce the target's behaviour explicitly.

## Re-verify

| Fact | Observed | Re-test |
|---|---|---|
| auto-mode analyser stops `cd && cmd`, heredocs, variables | 2.1.232/2.1.233, `2026-08-16`; not stopping on 2.1.310, `2026-10-24` | in auto mode on your version: `cd <dir> && sed -n '1,5p' <file>`, then a heredoc |
| Git Bash converts `/path` arguments | Git 2.49.0, gh 2.100.0, `2026-10-24` | `python <skill dir>/scripts/probe_argv.py /x` |
| PowerShell splits bare `-c.a.b=c` | PowerShell 7 `2026-08-24`; 5.1.26100 `2026-10-24` | `probe_argv.py -c.a.b=c` from each PowerShell |
| PS 5.1 `Get-Content` reads ANSI; `Set-Content -Encoding utf8` adds a BOM | 5.1, `2026-07-31`; 5.1.26100, `2026-10-24` | round-trip a UTF-8 file, then `check_text.py` on it |
| PS 5.1 redirected native stderr is terminating under `Stop` | `2026-08-17`; 5.1.26100, `2026-10-24` | a native call that warns on stderr, with `2>&1` |
| PowerShell deletes an env var set to `""` | 5.1.26100, `2026-10-25` | `$env:X = "x"; $env:X = ""; Test-Path Env:X` |
| Python pipes use the ANSI code page | Python 3.13.1, `2026-10-24` | `python -c "import sys; print(sys.stdout.encoding)" \| cat` |
| PowerShell tool caps a call at 10 minutes | `2026-09-25` | the tools reference, or a long `Start-Sleep` |
| Bash tool falls back to PowerShell without Git Bash; PowerShell primary when enabled | 2.1.120, 2.1.126 (changelog, `2026-10-24`) | the changelog |
| `mv -n` exit code: GNU 9.2+ exits 1, Git Bash exits 0 | `2026-09-25` | `mv -n a b` where `b` exists, `echo $?`, on each machine |

When one has changed, correct its line here and its date. Delete a workaround whose cause is gone rather than keeping it beside the new fact.

## How you can tell it worked

The program received the arguments, paths and text you meant, as a probe of what it received shows, and the command means the same thing in the shell that actually runs it.

## Files

| File | Does |
|---|---|
| `scripts/check_text.py` | flags mojibake (UTF-8 decoded as CP1252 or CP1250), a UTF-8 BOM, CRLF and invalid UTF-8 in files, directories or a repository's changed and untracked files (`--changed`); `--fix-crlf` normalises line endings and nothing else; `--self-test` checks the checker |
| `scripts/probe_argv.py` | prints the arguments a program actually received, its working directory and its pipe encodings, for measuring what a shell did to a command |
