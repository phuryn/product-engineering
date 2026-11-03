# Independent review: product-engineering, one change before a release

<!-- The brief for a review round (AGENTS.md § Releasing). Copy it, fill in only `## The subject`, and pass the copy to the wrapper with --brief. -->

## What this is

`product-engineering` is a public collection of agent skills, free under the MIT License: folders with a `SKILL.md` (frontmatter `name` and `description`, then instructions) and optional `references/`, `scripts/` and `agents/openai.yaml`. They ship as six plugin packs (`product`, `ai-shipping`, `agent-teams`, `agent-harness`, `app-stack`, `work-humanizer`) through `.claude-plugin/marketplace.json`. Readers install them in Claude Code, in Codex (which reads the same marketplace), or copy skill folders into a repository for any agent. The agents then act on these instructions, often without a person reading them first.

How the pieces fit:

- A skill's `description` is in the agent's context on every turn, and the agent loads the body when the work matches. A skill marked as started by the user (`disable-model-invocation: true` in `SKILL.md` for Claude Code, `agents/openai.yaml` with `allow_implicit_invocation: false` for Codex) is out of the agent's context and runs only when the user types `/<pack>:<skill>` (Claude Code) or `$<pack>:<skill>` (Codex).
- Skills refer to one another by name ("the `release-gate` skill") and to their own files by relative path. A skill must work when its folder alone is copied.
- The binding spec is `AGENTS.md`. `README.md` and each pack's `README.md` are what readers see first. `rejected.md` records requests the collection declined. `tools/validate.py` enforces the mechanical rules and must pass. The Python scripts inside skills are run by readers' agents on their own machines.

## The subject

<The range, mechanically: `<last reviewed commit>..HEAD`, its `git log --oneline`, and whether the working tree is clean. Then, in a paragraph: which skills and files the commits change, and what about them. Then any owner decision behind the change, stated as a decision so the reviewer doesn't report it as a finding. Then:>

Read the rest of the repository as context, above all the rest of each skill these commits touch and the skills those call. Old text is in scope where these commits make it newly wrong.

## Who uses it, and what is serious

The repository is public at `phuryn/product-engineering`. Anyone can read every file and install the packs. Its readers are product managers, founders and builders shipping software with coding agents, from a solo builder to a small team. Their agents read the skills and act on them.

Serious, however unusual the trigger:

- An instruction that leads an agent to the wrong database, project or environment, or into an irreversible or outward-facing action without the owner's go, or a secret into a chat, a commit, a log, a command line or a public page.
- A command, flag, endpoint or API shape a skill gives that fails or does something else on the versions the skill names.
- A script that crashes, exits with the wrong code, or reports a failed round as a clean one.
- A contradiction between two files a reader or agent reads, where following one breaks the other, including old text this commit left saying the opposite of its new text.
- A reference that doesn't resolve: a named skill, section or file that isn't there, or a skill the user must start referred to as one the agent loads.
- `tools/validate.py` passing something `AGENTS.md` says it must refuse, refusing valid content, or crashing.
- A README claim the skills don't back.
- A product, company or person named outside what `AGENTS.md` rule 1 allows, or private information in a public file.

Not blocking: wording taste, style, length, a sentence that could be clearer but is not wrong.

## The job

Find what would block or break this release. Label every finding **INTRODUCED** (by this commit) or **PRE-EXISTING**. For each, state the literal sequence that triggers it and who performs it: which reader or agent reads which file, what it then does, and what goes wrong. A finding that can't name its trigger usually has none.

## The form

A numbered list, ranked by what it costs a reader. For each: the claim, the evidence as `file:line`, the severity (Critical, High, Medium, Low), and what to change. Terse, no praise. End with the ones most likely to bite. If you find nothing above Low, say what you read, what you expected to find and why it holds.
