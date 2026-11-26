# Delegation

Each rule heading quotes `SKILL.md` or a reference, followed by the case that taught it.

## A brief with the goal in it comes back with judgement.

- `2026-08-21`, a remote-control product. A brief with the goal in it comes back with judgement: "the force at replay end is redundant, here is why", "a 30px overlay would cover the last line, which is worse than the jump" — each of which changed what shipped.

## Keep operational changes and production credentials with the session agent.

- `2026-10-23` and `24`, a monitoring product: every stage brief listed these under "What stays with me". Delegated builds made 28 commits the day before the first release and none on the day of five production promotions, which was review fixes and real systems throughout.
- `2026-11-14`, the owner distinguished development suite runs from operational changes. Builders run and fix their tests; the session agent still applies migrations before dependent tests, serializes shared-data runs and independently verifies the full gate.

## If the brief would be nearly as long as the diff, write the diff.

- `2026-08-21`: having already found the exact lines, an agent wrote a 60-line brief and waited twenty minutes for a change it could have made in two.

## A build round that has made no writes on a small change is stopped.

- `2026-09-22`, a builder sat twelve minutes on a fifteen-line change with a clean tree.

## State the constraints that bind, including the do-nots.

- `2026-08-21`: The briefs that mattered most carried a warning, not a task: "do not fix this in the argument builder — the same string feeds another spawn path", "replay is off the table, recovery only". Each stopped a plausible fix that would have been wrong in the large.

## Define proof for this handoff, including checks you must run.

- `2026-10-22` and `23`, a monitoring product: briefs that said so got "written, not run" back. The invented counts under `SKILL.md` § When it comes back are what happens when a brief doesn't.

## Ask it to exercise every existing page and function the stage touches, not only its own.

- `2026-11-01`, an evals product: a builder's integration tests found a bug in the session agent's own code, an embed across a relationship that doesn't exist, on a page no earlier test had opened.

## The brief is the delegate's entire reality.

- `2026-10-23`: the owner changed the identity provider's organization settings mid-build.

## A feature that guesses from real-world input starts from evidence.

- `2026-10-23` and `24`, a monitoring product: a brief for suggested health checks was built on a scan of 495 real apps. A live run on 30 sites reversed one binding decision, because a browser-like `Accept` header turned checks into page loads: one framework's health route answered HTML, and an identity provider's development instance redirected every check to its sign-in. The same run found four more defects.

## Name ranges, not commits, in a brief you will reuse.

- `2026-08-22`, twice in one session: A second round run from a brief that pins a SHA re-reviews the commit already reviewed and confidently re-reports what was fixed one commit later.

## The session that wrote the code never clears it.

- `2026-11-06`, owner: The reviewer is a fresh session, ideally another model family, or the builder's family when no other can run, never the building thread resumed or forked and never a subagent of it.

## Set the model explicitly on every spawn.

- `2026-07-03`: a full day of mining agents, evidence filers and a benchmark babysitter ran silently at top-tier rates; the babysitter alone was about twenty rounds of purely mechanical work a mid-tier model does identically.

## Use the top tier adversarially.

- `2026-07-24`: The highest-value top-tier call of one day was "refute this audit", which overturned the parent's framing and trimmed two over-read magnitudes.

## Pull down, decide up.

- `2026-08-12`: a whole search-data scan ran in a top-tier parent — paginating an API, reducing 39K rows — when the only step that needed it was deciding that one 219K-impression row was worth zero.

## Parallelise on evidence, not impatience.

- `2026-08-20`: of eight commits, six touched one protocol file and five one host file, so almost nothing in the batch was parallel-safe; the two that touched neither were exactly the two that should have run alongside.

## Never two writers in one tree.

- `2026-08-19`: A fix written while a delegate built in the same checkout vanished silently when the delegate wrote its files back; `git status` showed the file identical to `HEAD`.

## Parallel stages merge through an integration branch.

- `Undated`: Two branches that pass alone can fail together (a test fixture from one predated a field the other made required).

- `2026-10-22` and `23`, a monitoring product: 39 merges into the integration branch, 16 with conflicts; 25 of the 37 conflicted files were shared docs. Two branches' migrations collided once, and the unapplied one was renumbered after the other, already applied with a later timestamp.

## Every merge checks the new migrations' timestamps against the ledger.

- `2026-11-01`, an evals product: a builder's timestamp matched, to the second, one applied on the main branch while it built.

## Parallel sessions share more than a tree.

- `2026-10-22`, a monitoring product: a design-review session created records in the gate's test account mid-run and turned the gate red, and development's workers picked up the suites' test records, about 90 checks a gate run racing their assertions.
- `2026-10-24`, a signed-in browser step failed two runs of three under a parallel review's load.

## Never `git checkout -- <file>` (or `git restore`) on a tree carrying uncommitted work.

- `2026-08-15`, twice in one day; one implementation was recovered only from a source map that still embedded the original TypeScript.

## When a build runs late, measure where the time went before changing the model.

- `2026-11-13`, a coding-agent client: the model worked about 35% of roughly 22 hours, with the rest in gate runs, review rounds and waiting. One stage's estimate rose from 6 hours to 12.5. The elapsed time alone did not show where the build was slow.

## Check the disk before believing a round happened.

- `2026-09-16`: A round that ran without write access returns a reasoned report that changed nothing and reads exactly like one that worked.

## Re-run its tests yourself, and rewrite any evidence it wrote from your own run.

- `2026-09-16`, `2026-09-17`: A delegated builder whose sandbox could not reach the database or a browser had no passing gate to report; twice its runs were written up with invented counts.

## Compare the test inventory before and after each delegated turn.

- `2026-11-18`, a builder for a live Q&A product rewrote a visual spec to cover only the changed states, silently dropping six captured states.

## Before passing a delegate's "commands for the owner" up, do every one you can.

- `2026-10-23`, a monitoring product: a handoff listed the identity provider's OAuth settings as owner settings; they were applied through its backend API with the instance's secret key and re-read, and the migrations and edge rollout in two other handoffs' owner commands were run by the coordinator.

## A builder's objection that is a product decision goes to the owner.

- `2026-11-01`, an evals product: a builder found that the brief's sample above a spending cap contradicted the brief's own overshoot bound; it was right, and which to keep was the owner's call.

## When you take a handoff over, put a dated status line at its top.

- `2026-10-24`: a handoff still opened "incomplete" and "uncommitted" after the coordinator had committed, reviewed and pushed it, and it claimed a deploy the environment log never recorded; review rounds found both.

## Audits record `HEAD` and `git status --short` at the start and again before delivering.

- `Undated`: An audit once reported a file "in limbo" whose deletion had been committed earlier the same session.

## Repeated correct fixes that don't work mean the model of the problem is wrong.

- `2026-08-21`: four rounds, each correct and green, none fixing the symptom.

## "Ready to test" means testable with nothing to do first.

- `2026-08-19`: the owner tested a fix twice against last night's build.

# Codex

## Confirm the build model and the review model with the user.

- `2026-11-18`, the owner: "there are two choices. Model for building. Model for reviewing. My preference and suggestion for both is newest available sol high or xhigh. Confirm with the user." And: "then user preference goes to user files."

## Keep product decisions, operational changes and stage-completion judgement with the session agent.

- `2026-11-14`, the owner allowed builders to run development tests and fix failures before handoff. Applied migrations still go through the session agent before dependent tests; deploys, pushes, provider settings, secrets, production credentials and final stage judgement remain with it.

## Keep resumable briefs in a persistent file and use `--read`.

- `2026-11-14`, an evals product's restarted session lost every scratchpad script and cited evidence file. Resumable build briefs need the same persistence as the status and evidence described by the `flight-deck` skill.

## Delegate only what is worth the hand-off; the test is size, not time.

- `2026-09-22`, a builder sat twelve minutes on a fifteen-line change with zero writes and a clean tree.

## Pass it on every build dispatch, not only the ones you think are new sessions.

- `2026-09-16`: a round meant to fix twelve failing tests resumed as a new session, ran read-only, and reported a decision with no diff behind it.

## Leave builds uncommitted when the session agent owns the commit.

- `2026-10-23`, a monitoring product: four worktree builds came back uncommitted, three of them quoting the `index.lock` error; other platforms not tested here.

## A test-running build runs without a sandbox, bounded by its instructions.

- `2026-11-14`, the owner chose builder-run tests with instructions as the boundary, rather than an enforced sandbox. Observed on macOS, Codex CLI 0.166.0 and Playwright 1.64.1: `workspace-write` denied Chromium's `mach-register` and DNS failed; `danger-full-access` started the browser and the network answered. Earlier sandboxed builders had handed test failures back to the session agent instead of fixing their own tests.

## Name `$app-stack:ui-design` in a build that adds or changes screens.

- `2026-11-03`, an evals product: Codex, with no pack installed, built screens without the method, and the owner's click-through found five layout bugs. Once the pack was installed, a headless `codex exec` loaded `$app-stack:ui-design`, codex-cli 0.166.0.

## A usage limit makes the builder unavailable, as a missing CLI does.

- `2026-10-22`: the reset was 90 minutes away, and the session agent built two stages with its own subagents rather than wait.

## A resume does not keep the session's model.

- `2026-10-01`: a resumed session came back on the config default, and nothing failed to say so.

## A resume does not keep the session's sandbox either.

- `2026-11-17`, a product's second build round: the wrapper resumed the session started with `--sandbox danger-full-access`, which then ran read-only, answered that it was blocked, changed no files and exited 0. Called directly with `-c sandbox_mode="danger-full-access"`, the same session built. A probe that day read the header's sandbox: `workspace-write` when new, `read-only` on a plain resume, `workspace-write` again with the override.

## Use the configured binary, installed CLI, then the extension bundle.

- `2026-10-22`: the extension's bundle was a 0.155 alpha without `codex-code-mode-host.exe`, and every tool call of a build round failed before it ran, with no file changed.

## Explicitly open required instruction sections beyond the entry-file context budget.

- `2026-11-16`, Codex CLI 0.169.0 on Windows: a 104,297-byte `AGENTS.md` exceeded the logged 32,768-byte budget and its role table did not load. Builder briefs must name needed sections beyond that budget for explicit opening.

## Name `$ai-shipping:test-harness` in builds that run tests or the gate.

- `2026-11-16`, a Windows builder had only `app-stack` and `agent-harness` installed and enabled. A prose skill name could not load the missing `ai-shipping` pack.

## Apply `independent-review` for round scope, brief, triage and stopping.

- `2026-11-16`, Codex CLI 0.169.0 on Windows: elevated sandbox mode ran for 60 minutes with zero commands before timeout; unelevated completed in about 15 minutes. The review wrapper now offers an explicit mode override, preserving config lookup when absent. The earlier isolation tool-count measurement was on macOS, not Windows.

# Claude Code

## Keep product decisions, operational changes and final judgement with you.

- `2026-11-14`, the owner allowed builders to run and fix development suites, with one runner on shared data. Deploys, applied migrations, pushes, provider settings, secrets, production credentials and final verification remained with the session agent.

## Route reviews of commits through the `independent-review` skill's wrapper.

- `2026-11-01`, an evals product ran each review round by hand with git commands allowed, because this line did not say where a review of commits goes.

# Grok

## Keep product decisions, operational changes and final judgement with you.

- `2026-11-14`, the owner distinguished development suite runs from operational changes. Builders run and fix their tests; deploys, applied migrations, pushes, provider settings, secrets, production credentials and final verification remain with the session agent.

## Run a small build first and read the disk.

- `2026-11-02`: the calling agent's safety classifier refused a fully approved Grok session on the author's machine.

## Approve reads with `--always-approve` and reject rounds with short output.

- `2026-09-08`: without it, an exit 0 after a sentence of preamble, which reads as "found nothing".

## Use `grok login --device-auth` to sign in without a local browser.

- `2026-10-31`, an evals product signed its reviewer in this way.

# Gemini

## Keep product decisions, operational changes and final judgement with you.

- `2026-11-14`, the owner allowed builder-run development suites while retaining operational changes and final verification. This does not establish that this CLI can run every suite; a tool or platform blocker still names the check handed back to the session agent.

## Google does not support another agent driving `agy` on a consumer plan.

- `2026-10-07`: a developer-forum answer said another agent could use a consumer-signed-in Antigravity CLI.
- `2026-10-16`: a reply in Google's voice on its developer forum said the FAQ superseded that earlier yes. It named Free, Google AI Plus, Pro and Ultra, including the unmodified binary run as a Claude Code or Codex subprocess.
- Google's FAQ, read on `2026-11-13`, describes headless `-p` as intended for direct scripts and CI. It says use inside a third-party coding agent is unsupported on consumer plans. A neighbouring answer says third-party access through an Antigravity sign-in breaks the terms and can lead to suspension. It recommends Gemini Enterprise or a Google AI Studio API key.

## The owner chooses the sign-in, and the agent never chooses it for them.

- `2026-11-14`: the owner chose to test the official CLI on a paid consumer sign-in of their own, knowing Google's stated support status. The owner asked for the skill to exist with that status stated plainly, and for no workflow in the collection to recommend Gemini. The choice was one person's, about one account; it settles nothing for a reader.

## An empty answer or a denied permission means the turn failed.

- `2026-11-14`, CLI 1.5.8, macOS: a command needing approval was auto-denied headless. The turn ended with an empty response, `denied_actions`, `status: SUCCESS` and exit 0. Stderr began `jetski: no output produced`. A deny-rule refusal instead appeared as a tool error and the agent continued to answer. A sandbox bypass request and an outside file-tool write also ended empty; exit 0 proved no work.

## A linked worktree's external git directory is outside the sandbox.

- `2026-11-14`, CLI 1.5.8, macOS: git could not read history inside a linked worktree because its git directory lived outside the workspace. The same commands worked in a self-contained clone. The reviewer therefore needs a clone rather than another linked worktree.

## Treat web search as available even when every guessed deny fails.

- `2026-11-14`, CLI 1.5.8, macOS: file writes and commands failed against configured deny rules, but `search_web` ran. None of the action names tried denied it. A consult counts it; a review fails when it occurs.

## Do not substitute CLI permission modes for the wrapper's boundaries.

- `2026-11-14`, CLI 1.5.8, macOS: `--mode auto` said it was unavailable for the account and continued in default mode. `accept-edits` allowed an edit, then auto-denied a command and ended the turn empty. Plan mode wrote a plan in the user's configuration directory and asked for confirmation; it did not provide a write barrier.

## Use the sandbox with default permissions and never request a bypass.

- `2026-11-14`, CLI 1.5.8, macOS: a shell write inside the workspace landed; an outside write failed with `operation not permitted`. Shell network access could not resolve a host, and home listing was refused. The failed command invited `BypassSandbox`; that request needed permission and ended the headless turn empty.

## Report the instructions that still load and cannot be switched off.

- `2026-11-14`, CLI 1.5.8, macOS: headless runs loaded workspace instructions, user rules and five built-in skills. `--disable-slash-commands` did not remove them. The registry still advertised 60 tools after deny rules were applied, including subagent tools, so registry membership did not establish a usable permission.

## Get the user's clear agreement before driving Gemini through this CLI.

- `2026-11-14`: the first build made this a skill only the user could start, so nobody would be offered Gemini unasked. The owner replaced that the same day with automatic loading and an informed, clear yes before a run, or an explicit standing preference. Naming Gemini before hearing the support status does not supply that agreement. The agent keeps any standing preference outside the skill and wrapper; no consent flag or state was requested.

## Pass copies of external briefs and attachments in a dedicated folder.

- `2026-11-14`, CLI 1.5.8, macOS: the reviewer's shell created a file in the real brief's folder because the wrapper added that folder. Nothing reported the write. Adding an input's parent exposed unrelated files to shell writes. The revised handoff gives the partner prepared copies, with persistent earlier turns for a resumed consult or build and disposable inputs beside a review clone.

## Resolve relative paths in the work directory, never the brief's folder.

- `2026-11-14`, CLI 1.5.8, macOS: the peer resolved a repository-relative path against the external brief's directory and got file-not-found. The pointer must name the work directory explicitly, or the snapshot for a review.

## Probe protected paths without treating writable temporary folders as failures.

- `2026-11-14`, CLI 1.5.8, macOS: the original probe put its outside canary in a temporary folder. The sandbox allowed that write, so a healthy install returned `review outside shell deny: NOT HELD` and exit 1. A protected canary under the wrapper's state root tests the refusal the live run established; temporary writes are reported separately as information.

## Never answer a denial with an allow rule or skipped permissions.

- `2026-11-14`, CLI 1.5.8, macOS: after an automatic denial, the CLI advised an allow rule or `--dangerously-skip-permissions`. The wrapper relayed that advice without its own instruction. Either suggestion removes the boundary the caller chose; the caller must avoid the action in its brief or perform it itself.

## Count tool errors without calling each one a permission refusal.

- `2026-11-14`, CLI 1.5.8, macOS: both a missing file and a protected-path read incremented `refused=`. The counter measured tool calls ending in `ERROR`, not permission refusals. `tool_errors=` preserves that evidence without claiming every failure proved a permission boundary. Unknown-model and denial text also printed twice when result and stderr repeated it; diagnostics must keep the useful text once.

## Give the peer a file list before asking it to explore.

- `2026-11-14`, CLI 1.5.8, macOS: the peer had no listing, grep or glob tool of its own and read the CLI's built-in skill files unasked. A work-directory file list provides names without granting a shell. A non-git directory needs an explicit skip notice and filenames from the caller.

## Keep the peer inside the work directory and explicitly named folders.

- `2026-11-14`, CLI 1.5.8, macOS: re-reading an earlier turn's external brief needed permission when the wrapper added only the current brief's temporary folder. The permission could not be asked headless and ended the turn. A stable handoff folder keeps earlier prepared inputs available across resumes; the standing sentence names the allowed read locations.

## The sandbox permits workspace, temporary, cache and added-folder writes.

- `2026-11-14`, CLI 1.5.8, macOS: a build script tried each location once. Shell writes landed in the workspace, system temporary folders, the user's cache directory and an added folder. Writes to the workspace's `.git`, home, `~/.gemini`, a sibling repository and a home dotfile were refused. Home, Desktop, SSH and sibling listings were refused; added, system-binary and temporary listings worked. Reads of hosts, git configuration and an added file worked; shell configuration, CLI settings and a sibling file were refused. HTTPS curl exited 6; a numeric HTTP destination exited 7. A self-contained clone's git history remained readable. The earlier claim that the reviewer could write inside its clone “and nowhere else” was false.

## Leave sandboxed build changes unstaged for the session agent to commit.

- `2026-11-14`, CLI 1.5.8, macOS: `git add -A && git commit` exited 128 because the sandbox refused creation of the workspace's `.git/index.lock`. Staging failed before a commit could begin. The builder must leave its diff in the working tree for the session agent to inspect and commit.

## Attach external review inputs before asking the snapshot to read them.

- `2026-11-14`, CLI 1.5.8, macOS: the review helper wrote prompt and subject files into the source git directory. Passing the prompt made that original directory writable through `--add-dir`. Its absolute checkout reference also sent reads into the real repository, which the sandbox refused; an outside file-tool read needed permission and ended the turn. The corrected flow copies the subject through `--attach`, rewrites references to the copy and snapshot, and stops before a model starts when a named snapshot file is absent.
- `2026-11-14`: a review round found that a brief naming the repository inside a quoted command stopped the run before a model started. The rest of the quoted span was read as part of a filename. Validation must try both the whole quoted filename and the path named inside a command.

## Require successful subject reads even when the partner answers confidently.

- `2026-11-14`: a review round found that reading only its brief, named by a relative path, let a review return 0. `git --version` counted as a read too. The gate needs a file-tool read placed inside the snapshot or at a current attachment copy. Recorded subject roots and attachment paths keep that evidence checkable after the snapshot is deleted.
- `2026-11-14`, CLI 1.5.8, macOS: a reviewer ran a 29-second test command, then used `manage_task` with `Action: status` to retrieve its status and log. The wrapper rejected the sound 17-minute review as an unknown-tool run and withheld its answer. Command-status retrieval needs the command boundary; a failed subagent or workflow attempt does not prove the deny rules held.
- `2026-11-14`: the next review round found that the Git exception misjudged subject reading twice. `git diff` of two outside files passed without a subject read. No recorded step established a command's working directory, so the gate could accept another repository or reject a snapshot subdirectory. The exception was removed rather than patched; only placed file-tool reads count for review recordings with subject metadata.

## A repository's hooks and plugins run outside the sandbox and the deny rules.

- `2026-11-14`, CLI 1.5.8, macOS: a scratch repository's `.agents/hooks.json` held `SessionStart` and `PreInvocation` command hooks. Consult wrote four lines each to a home file and a file beside `hooks.json`. It returned 2 only because Git status changed, without naming the hooks or the home write. Build with `--sandbox` wrote the home file and returned 0. A fresh review clone containing the committed hooks also wrote the home file and returned 0. Its change list named only the workspace file. The CLI started the hooks itself, outside the tool events, sandbox and deny rules.
- Bundled `agy-customizations` docs, read on `2026-11-14`, CLI 1.5.8, named four workspace roots and the user root `~/.gemini/config/`. They described command hooks, plugin hooks, stdio MCP startup and plugin registrations through `plugins.json`. Only a root's own command hooks were run; plugin hooks, plugin MCP startup under `mcp(*)` and registration paths remain unestablished. The detector therefore refuses known workspace entries by presence, while naming user-level entries without refusing them.
