---
name: ui-design
description: "Mandatory for any product's screens, a builder's too, and any mock, prototype or artifact that shows them: its design system, colour, type, components; judging the look."
---

# UI design

**Load this skill for the whole of a product's look.** It holds the rules, which outside skill leads when, and how to judge the result. Reading only part of the method leaves already documented mistakes open to repetition.

## What binds, in order

1. **Keep taste and changes to written rules with the owner.** Apply the `agent-instructions` skill to record choices and their precedence. Put each visual question to them as specimens built in the product's real tokens, side by side, never described in words. `references/review.md` says how to sort a fix from an owner's call.
2. **Apply the method to every kit and every screen.** Read `references/method.md`. A mock, prototype or artifact of a screen is high fidelity too: read the method; where the product has a kit, load its CSS and compose it rather than imitate it (a new product's artifact keeps its values in tokens, and the design stage builds the kit); and check a screenshot against the method before the owner sees it. A product departs from a rule only by the owner's decision, recorded in its kit README with the reason.
3. **Keep the product's kit in three files and compose every screen from it.** Put them wherever the product keeps design, often a `design/` folder: `tokens.css`, every raw value (colour, type, space, radius, duration); `kit.css`, the primitives, built from tokens only; and the kit README, the product's own design document: its direction, palette, type, layout and button roles, each with its reason, and every departure from the method. With no provided design system, start the kit at the design stage, before the first app screen (an artifact before it keeps its values in tokens); maintain it and extend its primitives for each later need so buttons, fields and dialogs remain one set. Screens compose the kit; a screen never invents a style.
4. **Take collection suggestions only through the kit's tokens or primitives.** Record them in the kit README; read `references/collections.md`. Where a collection disagrees with the method, the method wins.

**Every screen builder loads this skill from the installed `app-stack` pack.** Keep no product copy. A copy freezes the method at its copied version, and Claude Code loads it twice beside the pack. Builders need to be able to load the rule to read it.

**A builder that isn't Claude Code has the pack installed in it too.** Codex reads the same marketplace (`codex plugin add app-stack@product-engineering`), and a brief names the skill there as `$app-stack:ui-design`: headless `codex exec` loads it with the pack installed (observed `2026-11-03`, codex-cli 0.166.0). An agent with no plugin installer takes the folder through `npx skills add`, into its own skills folder only. Whatever a collection taught that the next screen needs goes into the kit README, not just the session that used it.

## Before any screen: the jobs map

**Map the user's jobs before drawing any screen, a builder's included.** Work out what people come to do, with one row per job: the job in the user's words → its screen → the screen's one question → its primary action. Put the map in the proposal artifact and every stage brief adding screens. A screen with no job is cut; a job with no screen is a gap.

- **The product's data rules stay out of the copy.** The brief lists them (how records are split, sampled, versioned or locked), and a screen shows each only as an outcome in plain words: "12 traces wait for your review", never the table or the method's own vocabulary.
- **Default to the familiar tool's structure when replacing one the owner knows.** Generalize that structure and justify every departure in the kit README.
- **The example data fills every screen.** Fill every tab too. Show empty states on purpose beside it, so a click-through never meets an empty screen.

## A stage with screens is done only after the visual checks

**Run every visual check before the owner's click-through.** Complete the newcomer walkthrough below, the rendered-screen pass against `references/screens.md § What to verify visually`, and the app-screen screenshot critique. Critique at 1440, 768 and 390, with three rounds at most.

**Run the scored Impeccable-style audit before the owner's click-through at the first screens and whenever the kit changes.** Fix its P0 and P1 findings. Rerun it before a release changing a screen or kit, and whenever the owner asks. Both critique and audit run from `references/collections.md` checklists without installing the collections. The owner then judges the look (`references/review.md`).

### The newcomer walkthrough

**Give a fresh session only the ordered screenshots and the user's job.** Never give the brief or code; alternatively, ask a person new to the domain. Ask the same questions for every screen: what is it for, what would you press next, and what is unclear? Fix any screen it cannot explain or next step it cannot find. Capture every route and dialog with a Playwright crawl at 1280 and 390. Crop pages taller than about 3,000px into ordered parts for reading without downscaling. For Clerk's test-user sign-in recipe, apply the `clerk-production` skill (`references/authenticated-mile.md`); other providers use their development test sessions.

## Which collection leads, stage by stage

| Stage | Leads | Take | Keep out |
|---|---|---|---|
| The jobs. Before any screen | this skill, § Before any screen | the jobs map; the data rules kept out of the copy | a screen per table |
| Direction. No look yet; the look is the problem; a public page whose job is to persuade | `frontend-design` (always on) | a direction grounded in the product's subject; a plan (palette, type, layout, principles) checked against the generic defaults before anything is built; keeping brand colours still runs the kit stage | a new direction per screen. Once one is picked, it stops leading |
| A choice between options. A palette, a font pairing, a chart type, a stack's convention | UI/UX Pro Max | candidates to choose from. The pick goes into the kit by hand | its persisted design-system files and its installer: a second design system beside the kit |
| The kit | the method, with `frontend-design`'s plan | tokens and primitives that satisfy every rule in `method.md`, each held by a test where one can be written | anything a collection proposes that the method forbids |
| Screens people work in. Dashboards, admin, tables, settings | the app-screen checklist in `references/collections.md § Taste`, distilled from its last upstream app chapter | the screen's one question and face; every block's empty, zero, loading and error state; colour only on data, status and the one primary action; its screenshot critique, three rounds at most | Taste's current company-page system, and its palette and type when a kit exists |
| Charts | `dataviz` (built in) | form first, colour last; its palette validator; one axis; hover by default | state colours reused as series colours |
| What a screen says | `references/screens.md § What a screen may claim`, and `frontend-design`'s section on writing | sentences only as true as what the renderer is handed; one function for every summary of a state | — |
| Before it ships | `references/screens.md § What to verify visually`, then Impeccable | every width, state, theme and role; Pro Max's web checks (`quick-reference.md` §1–3, §8, §9, inside the UI/UX Pro Max skill; without it, its distilled list in `collections.md`) as a quick pass; Impeccable's audit, hardening and polish | Pro Max's native/mobile pre-delivery checklist for web work; Impeccable's commands that write their own design documents, and any redesign through it; ellipsis for text a person typed |
| The owner judges the look | `references/review.md` | measured claims, before/after specimens in the real tokens, fixes split from the owner's calls | opinions without numbers |
| A page published as a claude.ai artifact | `artifact-design` (built in) | its page contract and both themes | — |

Read `collections.md` for each collection's purpose, what to take, what to keep out, installation and a checklist usable without installing it. Without third-party collections, design from the method, `frontend-design` and those checklists.

## The owner's standing preferences

**Record your preferences in the kit README or user-level agent instructions.** For one product, use the kit README with a pointer from the product's entry file. For every product, use your user-level agent instructions. Use your own words and the date of each choice; edits to the installed pack vanish at its next update. The entries below are the author's worked examples: a taste call with its receipt and scope. Until you write your own, treat them as one owner's taste, not rules.

- **Weight doesn't mark state.** "Colors already say this. Two things saying the same it unnecessary in my opinion." (author preference, `2026-10-22`, rejecting "bold only on problems".)
  - Don't propose bold, size or weight as a second signal for what colour, shape and word already carry.
  - This is separate from the method's *state is form as well as text*. That rule exists so colour is never the only signal: it's accessibility, not emphasis, and it stays.
  - It covers bold that's already there, not only new proposals. "Same weight for every state" (author preference, `2026-10-22`, asked whether a down badge's word and a failed value should lose their bold): a problem's badge, value, row and name wear the weight of their healthy counterparts. A title stays bold because every title is, whatever state it describes.
- **Use 8 px corners on an app's buttons.** "8 px corners in the app" (author preference, `2026-10-22`, a monitoring product, shown its pill buttons beside 8 px ones).
  - Inside the app, buttons and segmented controls take a corner between an input's and a panel's, so a control reads as part of the form around it.
  - Tags stay pills everywhere, so inside the app a pill means a label, not something to press. The marketing site and public pages may keep pill buttons.
  - Start the next product's app this way. If its brand points elsewhere, show the owner both before choosing.
- **Calm and reassuring is the target for monitoring and status products.** Supabase is the reference the owner named. A healthy screen says so in its own colour, and nothing on it says *press* or *beware* louder than that.

Each rule's origin, the case that taught it, is in `receipts.md` beside this file; read it when a rule's edge is unclear.

## How you can tell it worked

Every screen answers a mapped job and passed the walkthrough, rendered pass and screenshot critique; the last scored audit has no open P0 or P1. The owner approved its look at phone and desktop width, and every raw style value comes from the tokens.

## When something is learned

- **Send lessons true for any product to this collection.** Make a change for this collection, drafted in the product's feedback file or as an issue on the collection's repository (`/agent-harness:retro` says how), naming the file it belongs in:
  - a rule for the kit or for building screens goes in `method.md`;
  - a rule about what screens claim, or how they're checked, goes in `screens.md`;
  - a change to the review procedure goes in `review.md`.

  Give each its receipt: the date, and what happened, in a product named by kind, not by name. Hold it with a test where one can be written: a rule only in a report is gone by the next product.
- **Keep lessons true only for this product in its kit README.**
- **Record owner preferences in their own words.** Use the kit README or their user-level agent instructions (§ The owner's standing preferences).

## Where the method lives

- **Replace `design` with `ui-design` in product agent instructions.** Change any "apply `design`" instruction there.

- **Install `app-stack` in every agent that builds screens.** Use Claude Code for the user, or with `--scope project` so every checkout of the product asks for it; Codex from the same marketplace; any other agent through `npx skills`. Each keeps it current with its own update command (the collection's README, § Install).
- **Delete a product's skill copy once the pack is installed.** This includes `.claude/skills/design/` or `ui-design/`, and `.agents/skills/` equivalents. Before that, `diff -r` against the pack's installed folder shows what the copy says that the pack doesn't: this product's lessons go to the kit README, the owner's preferences as above, and a lesson for any product to this collection (§ When something is learned).
- **Nobody edits the installed pack and hopes it travels.** A product's lesson goes into its own docs the day it is learned, and the general one goes to this collection as above.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/method.md` | the rules every kit and screen satisfies | writing or changing a kit; building any screen |
| `references/collections.md` | each design skill collection: what to take, what to keep out, how to install it, its checklist distilled | choosing or running a collection, or working without one |
| `references/screens.md` | what a screen may claim; what to verify visually | changing what a screen says; before a release |
| `references/review.md` | reviewing a built product's look with its owner | the owner judges the look; a release's visual pass |
| `scripts/color.py` | OKLCH lightness, chroma and hue, and WCAG contrast (standard library only) | any question about a colour: measure it, don't describe it |
