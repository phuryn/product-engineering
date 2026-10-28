---
name: design
description: "Before designing a screen or design system, choosing colours, type or components, or judging the look: design, build and review product UI with its owner."
---

# Design

One skill for the whole of a product's look: the rules, which outside skill to use when, and how to judge the result. Before it, the method lived in one file, the choice of skills in another, the screen rules in the test docs and the review in a skill of its own, and a product that read only some of them repeated mistakes the others had already written down.

## What binds, in order

1. **The owner's words.** Taste, and any change to a written rule, is the owner's call. Put each visual question to them as specimens built in the product's real tokens, side by side, never described in words. `references/review.md` says how to sort a fix from an owner's call.
2. **The method** (`references/method.md`). Every kit and every screen satisfies it. A product departs from a rule only by the owner's decision, recorded in its kit README with the reason.
3. **The product's kit**, three files wherever the product keeps them (often a `design/` folder): `tokens.css`, every raw value (colour, type, space, radius, duration); `kit.css`, the primitives, built from tokens only; and the **kit README**, the product's own design document: its direction, palette, type, layout and button roles, each with its reason, and every departure from the method. Screens compose the kit; a screen never invents a style.
4. **The collections advise** (`references/collections.md`). A suggestion reaches code only as a token or a primitive in the kit, recorded in the kit README. Where a collection disagrees with the method, the method wins.

**A product carries this skill in its own repository, at `.claude/skills/design/`, copied, never pointed at.** A rule that lives only in another repository doesn't get read. A monitoring product's kit README pointed at the method in another repository instead of copying it. It then shipped borderless Cancels in five places, which the method already forbade (`2026-10-22`).

**A builder that isn't Claude Code reads these as plain files.** Codex never sees a Claude Code plugin or a skill trigger. So a product's agent instructions name this folder by path. Whatever a collection taught that the next screen needs goes into the kit README, not just the session that used it.

## Which collection leads, stage by stage

| Stage | Leads | Take | Keep out |
|---|---|---|---|
| **Direction.** No look yet; the look is the problem; a public page whose job is to persuade | `frontend-design` (always on) | a direction grounded in the product's subject; a plan (palette, type, layout, principles) checked against the generic defaults before anything is built | a new direction per screen. Once one is picked, it stops leading |
| **A choice between options.** A palette, a font pairing, a chart type, a stack's convention | UI/UX Pro Max | candidates to choose from. The pick goes into the kit by hand | its persisted design-system files and its installer: a second design system beside the kit |
| **The kit** | the method, with `frontend-design`'s plan | tokens and primitives that satisfy every rule in `method.md`, each held by a test where one can be written | anything a collection proposes that the method forbids |
| **Screens people work in.** Dashboards, admin, tables, settings | Taste (`design-taste-frontend`), its app-screen run | the screen's one question; every block's empty, zero, loading and error state; colour only on data, status and the one primary action; its screenshot critique, three rounds at most | its page run, and its palette and type when a kit exists |
| **Charts** | `dataviz` (built in) | form first, colour last; its palette validator; one axis; hover by default | state colours reused as series colours |
| **What a screen says** | `references/screens.md § What a screen may claim`, and `frontend-design`'s section on writing | sentences only as true as what the renderer is handed; one function for every summary of a state | — |
| **Before it ships** | `references/screens.md § What to verify visually`, then Impeccable | every width, state, theme and role; Pro Max's pre-delivery checklist as a quick pass; Impeccable's audit, hardening and polish | Impeccable's commands that write their own design documents, and any redesign through it; ellipsis for text a person typed |
| **The owner judges the look** | `references/review.md` | measured claims, before/after specimens in the real tokens, fixes split from the owner's calls | opinions without numbers |
| **A page published as a claude.ai artifact** | `artifact-design` (built in) | its page contract and both themes | — |

`collections.md` has each collection's detail: what it is, what to take, what to keep out, how to install it, and a checklist usable without installing it. Without the third-party collections, design from the method, `frontend-design` and those checklists.

## The owner's standing preferences

**This section is yours to fill, in your own words, with the date you said each.** The entries below are the author's, kept as a worked example of what belongs here: a taste call with its receipt, and how far it reaches. Replace them with your own; until you do, treat them as one owner's taste, not as rules.


- **Weight doesn't mark state.** "Colors already say this. Two things saying the same it unnecessary in my opinion." (`2026-10-22`, rejecting "bold only on problems".)
  - Don't propose bold, size or weight as a second signal for what colour, shape and word already carry.
  - This is separate from the method's *state is form as well as text*. That rule exists so colour is never the only signal: it's accessibility, not emphasis, and it stays.
  - It covers bold that's already there, not only new proposals. "Same weight for every state" (`2026-10-22`, asked whether a down badge's word and a failed value should lose their bold): a problem's badge, value, row and name wear the weight of their healthy counterparts. A title stays bold because every title is, whatever state it describes.
- **8 px corners on an app's buttons.** "8 px corners in the app" (`2026-10-22`, a monitoring product, shown its pill buttons beside 8 px ones).
  - Inside the app, buttons and segmented controls take a corner between an input's and a panel's, so a control reads as part of the form around it.
  - Tags stay pills everywhere, so inside the app a pill means a label, not something to press. The marketing site and public pages may keep pill buttons.
  - Start the next product's app this way. If its brand points elsewhere, show the owner both before choosing.
- **Calm and reassuring is the target for monitoring and status products.** Supabase is the reference the owner named. A healthy screen says so in its own colour, and nothing on it says *press* or *beware* louder than that.

## How you can tell it worked

The owner looked at the screens at phone and desktop width and approved them, and every colour, size and spacing value on them comes from the tokens.

## When something is learned

- **True for any product:**
  - a rule for the kit or for building screens goes in `method.md`;
  - a rule about what screens claim, or how they're checked, goes in `screens.md`;
  - a change to the review procedure goes in `review.md`.

  Give each its receipt: the date, and what happened, in a product named by kind, not by name. Hold it with a test where one can be written: a rule only in a report is gone by the next product.
- **True for this product only:** its kit README.
- **An owner preference:** the section above, in their words.

## Where the copies live

- **Each product carries its own copy** (`.claude/skills/design/`, or `.agents/skills/design/` for agents that read that folder), copied whole, never pointed at (above).
- **Keep one master copy across your products** and send a lesson back to it, generalized, the day a product learns it. A product's copy that differs from your master is a lesson not yet sent back: `diff -r <master>/design <product>/.claude/skills/design` shows it.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/method.md` | the rules every kit and screen satisfies | writing or changing a kit; building any screen |
| `references/collections.md` | each design skill collection: what to take, what to keep out, how to install it, its checklist distilled | choosing or running a collection, or working without one |
| `references/screens.md` | what a screen may claim; what to verify visually | changing what a screen says; before a release |
| `references/review.md` | reviewing a built product's look with its owner | the owner judges the look; a release's visual pass |
| `scripts/color.py` | OKLCH lightness, chroma and hue, and WCAG contrast (standard library only) | any question about a colour: measure it, don't describe it |
