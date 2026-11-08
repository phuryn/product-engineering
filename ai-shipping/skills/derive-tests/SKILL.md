---
name: derive-tests
description: "'What should we test' or a coverage map: derive the coverage map and missing tests from docs and code; check mode reports staleness."
argument-hint: "[check] <repo path or area; defaults to the whole repository>"
---


# Derive tests -- Turn Intent Into Tests

**Turn documented intent into test cases that keep gaps from reopening.** The docs say what the system should do; an audit finds where the code doesn't. Read that intent and turn each load-bearing rule into a concrete case. Sort cases into automated tests, guarded live runs, and manual checks. Recommend the repo's defined gate, or green-before-merge CI where it defines none.

**Produce a coverage map and concrete cases, not a finished suite.** You or the next agent implement the deterministic cases. If the repo already keeps a test-coverage file, under any name, update that map instead of starting another. Apply the `shipping-artifacts` skill's Locations and names rule.

## Invocation

**Use check-only mode for a leading check or a map-currency question.** A request starting with `check`, or asking only whether the map is current, checks the scope that follows instead of running the workflow.

```
/ai-shipping:derive-tests                        Claude Code
/ai-shipping:derive-tests the checkout flow
$ai-shipping:derive-tests supabase/functions     Codex
/ai-shipping:derive-tests check
"what should we test here" · "is our coverage map current"   either agent, in plain words
```

## Prerequisite: documented intent

**Write down intent before deriving tests from it.** If system docs are missing or thin, apply the `document-app` skill first. Use the repo's docs location, or `documentation/` by default. This skill reads `flows.md`, `permissions.md`, and `automation.md` most heavily. Where intent is absent, say so rather than inventing rules to test.

## The workflow

### 1. Read the intent — and the tests that already exist

**Read the applicable system docs, treating their claims as unverified.** Read architecture, flows, permissions, variables, and any emails, cron, seo, and automation docs that exist. Apply the `shipping-artifacts` skill for each document's contents. Apply the `intended-vs-implemented` skill for the discipline of treating docs as claims to verify, not proof.

**Inventory existing assertions before claiming any rule is covered.** Read the test files, what they actually assert, and what runs in CI today. Distinguish coverage that exists now from coverage you propose; otherwise, the map can claim rules are pinned when nothing checks them. If there are no tests, say so plainly: that is itself a finding.

### 2. Extract the rules worth testing

**Extract deterministic rules whose violation crosses a consequential boundary.** These are the load-bearing trust, data, money, tenant, or privacy rules:

- authorization allow and deny cases, especially boundary crossings in `flows.md` and the matrix in `permissions.md`;
- input validation and output encoding at each sink;
- idempotency of jobs and dedup keys;
- fail-closed defaults: error, timeout, cache-miss, and flag paths that must deny, not allow;
- side-effect conditions: exactly when an email sends, a write commits, or a paid action fires;
- public-data-only constraints on public or bot routes;
- output-contract and tool-surface limits of any agent in `automation.md`.

**Skip cosmetic behavior; test rules whose failure harms someone other than the actor.**

### 3. Build the coverage map

**Mark coverage existing only when a repository test asserts the rule today.** Build one row per use case:

rule → expected behavior (including the negative case) → evidence source (doc + code) → test type → status (existing / proposed / none).

Use these test types:

- unit — pure and deterministic, no external services;
- integration (deterministic) — real wiring against a dependency the product runs for its tests, such as a local or development database or mocked provider; same pass/fail result every time;
- guarded live — a real external service the product does not run for its tests, such as an email provider, LLM, or third party; behind an explicit flag;
- manual — UI/visual or judgment calls; reviewer checklist items, not automated tests.

**Separate a test's dependencies from whether the repo makes it gate.** The repo's gate policy decides the latter (Step 5). A product may gate against its development database and identity provider's development instance, with real browser sessions, as in the `test-harness` skill. Those rows are deterministic there because the product owns the environments.

**Where no gate is stated, require the deterministic unit and integration set.** These tests pass or fail the same way on every run; guarded-live and manual rows don't gate. Either way, prefer unit tests where decision logic can be isolated. Use integration when the rule lives in middleware, RLS, or auth-guard wiring that only a real dependency can exercise.

**A pure helper complements testing real enforcement; it never replaces it.** When a rule can only be exercised live, you can extract its decision into a pure, unit-testable helper. That proves the helper's logic, not that the framework calls it. Wiring and policy enforcement still need an integration or guarded-live check: route middleware, DB row-level security, auth guards, and provider config. Otherwise, the helper can pass while the real path is unprotected.

### 4. Propose the tests

**Write a concrete case for every rule a deterministic test can pin.** For each unit or integration case, give its name, arrange/act/assert intent, and negative case it must reject. Group cases by the doc or flow they defend. Prefer the smallest test that pins the rule: one clear assertion per boundary, rather than an integration test that fails for ten reasons.

### 5. Recommend the gate

**Follow the repo's stated gate policy instead of proposing a replacement.** Start from its agent instructions, contributing guide, or release docs. They may define a local command plus human go, hosted CI, or another merge or release gate. Record that policy and its source in the coverage map, and check the deterministic set runs inside it. Don't recommend hosted CI or branch protection over the stated policy. If that gate omits the deterministic set, report a finding for the owner rather than proposing a different gate.

**Where no policy exists, suggest CI matched to the repo's tooling.** Recommend it; don't silently install it. Match the repo's stack and existing tooling:

- run the deterministic local set on every pull request: unit plus any integration test that runs without live services;
- keep guarded-live tests opt-in, manual or scheduled, never blocking;
- gate merges to `main` on green via a required status check plus branch protection.

Output the workflow file and branch-protection setting as a clearly labeled suggestion for user approval, not an applied change.

### 6. Report coverage and gaps

**Keep existing coverage, proposed tests, and unverified gaps in separate sections.** Write `tests.md` with:

- Existing coverage — rules a test in the repo pins today, from the Step 1 inventory.
- Proposed tests — recommended cases that don't exist yet, by type.
- Gaps — documented rules with no verification at all, ranked by what crossing them exposes.

The gaps are the backlog, where the next AI edit can silently break a boundary. Proposed coverage is not existing coverage: a rule isn't covered until a test actually asserts it.

## Check-only mode

**Check the map without rewriting it or running the tests.** This lets a release check a map maintained by hand or by whoever runs the gate. Write no file: neither the map nor a report. Read the tests; don't run them. Don't apply the `document-app` skill when docs are thin; list them under Not checked.

1. **Find the existing coverage map, and stop if there is none.** Follow the `shipping-artifacts` skill's Locations and names rule, as the workflow does. Say if none exists.
2. **Compare every map row against the system docs and test suite.** It is stale where:
   - a documented rule has no row, or a row cites a rule the docs no longer state or now state differently;
   - a row marked existing names a test that is gone or doesn't assert the rule;
   - a test pins a rule the map marks proposed or none;
   - a cited path, test name, or gate command no longer matches the tree.
3. **Leave the choice of which side is wrong to the owner.** The map may be behind, or a doc or test may have drifted from what the map records.

Print the output in the conversation:

```
Coverage check: [scope] — check-only, no files written

### Stale entries
1. [rule or row]
   - Map says: [entry] — `[map path]:[line]`
   - Docs or tests say: [what they state or assert] — `[path]:[line]`
   - Owner decides: fix the map, the doc, or the test.

### Not checked
- [thin or absent docs, tests whose assertion couldn't be read, areas out of scope]

### Summary
Coverage check, [date], commit [short SHA], scope [scope]: [N] map rows read, [N] stale entries, [N] not checked. Tests read, not run. No files written. Which side to fix is the owner's call.
```

**State what was read when the Stale entries section is empty.** Then stop: don't offer to rewrite the map.

## Output

**Write the map and full report to the repo's existing locations.** Use the defaults below only where it has none, giving the user both paths and saying which are plugin defaults:

- coverage map: `documentation/tests.md`;
- full report: `reports/test_plan_{timestamp}.md`.

```
Test Coverage: [scope]

| Use case | Rule (doc) | Expected behavior (+ deny case) | Evidence | Type | Status |
|----------|-----------|---------------------------------|----------|------|--------|
[status: existing / proposed / none]

### Existing coverage
[tests already in the repo, each tied to the rule it pins]

### Proposed tests
[grouped by flow/doc — name · assert · negative case · type]

### Gate
[the repo's stated gate policy, with its source, and whether the deterministic set runs inside it — or, where it states none, a workflow snippet for the detected stack + "green-before-merge" branch-protection note]

### Gaps — documented but unverified
[rules with no test yet, ranked by what crossing them exposes]
```

## Notes

- **Use derived tests to keep an audited gap from reopening.** This is the verification half of "documented == implemented": audits find today's gap, and tests stop tomorrow's edit reopening it.
- **Never fabricate rules to manufacture coverage.** If docs are silent, the gap is in the docs; fix them first with the `document-app` skill.
- **Let guarded-live tests gate only where the repo's policy puts them.** A flaky test of any type leaves the gate until fixed; otherwise, people start ignoring the gate.
- **Use this skill for test derivation only.** Use the `security-audit-static` skill for the gap audit itself. For the full document → audit → test → packet sequence, use the ship check (`/ai-shipping:ship-check`, or `$ai-shipping:ship-check` in Codex).

## How you can tell it worked

Every documented rule has a row, every row marked existing names a test that asserts it today, and the gaps are ranked. In check mode, nothing on disk changed.
