# test-harness: receipts

Each heading is a rule from `SKILL.md`, with the case that taught it.

## On another stack, keep the principle and swap the mechanism.

- `Undated`: The rules come from two kinds of product, named here only by kind. Most were learned on web apps built on Next.js (App Router), Supabase Postgres and Clerk, tested with Vitest and Playwright (a live Q&A product, a monitoring product and others). The two-halves harnesses and several rules from bugs — marked *the remote-control product* where they appear — were learned on a relay service with a web client and an editor extension with desktop installers that drives a CLI agent.

## Budget integration tests in round trips to the real database.

- `2026-11-04`, an evals product: a sandboxed builder wrote tests it could not run; 9 of 193 failed on test-side mistakes on the session agent's machine, then several timed out at 30 seconds against a remote database taking 130ms per round trip.

## A bug fix lands with a regression test run against broken behaviour.

- `2026-10-23`, a monitoring product: a review round's fix came with a journey check that passed on the commit before it; the fix was reverted and the assertion kept.

## After two fixes that pass their checks and leave the reported symptom unchanged, stop fixing.

- `2026-08-21`, a remote-control product: four rounds, each correct and green, none fixing what the owner saw.

## First check that the person is running your build.

- `2026-08-19`: the owner tested a fix twice against the previous night's build.

## Every feature that touches data gets the required boundary and integrity tests.

- `2026-11-01`, an evals product: builder-written integration tests found three bugs no review round had: a broken trace page no test had opened, a retention job that failed at runtime on an ambiguous plpgsql alias, and a workspace deletion that failed mid-cascade.

## Read every exit code from the log, never the notification.

- `2026-09-17`, a visual sweep's log ended `VISUAL_EXIT=1` under an exit-0 notification.

## The gate is the exit code, never the printed counts.

- `2026-09-23`: A run can print every test passed and exit 1 on one unhandled rejection; a report that quotes counts without the exit code has established nothing (`references/rules-from-bugs.md § Reading a red run`).

## An inherited report is a claim, not evidence.

- `2026-09-16`, a verified-sounding handoff missed unapplied production migrations.

## The coverage map is written by whoever ran the gate, and by nobody else.

- `2026-09-16` and `2026-09-17`, blocked builder runs were reported in the coordinator's name with invented counts.

## A deployed worker never stops

- `2026-11-01`, an evals product: at its first deploy the live worker claimed the integration suite's fixtures, and eight tests failed.

## A generated file can arrive rewritten by the tooling that wrote it.

- `Undated`: a commit landed reading "Grok sends , so".
