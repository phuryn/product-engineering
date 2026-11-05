---
name: design
description: "Mandatory for any screen work, a builder's too: designing or building a screen or design system, choosing colours, type or components, judging the look."
---

# Design

One skill for the whole of a product's look: the rules, which outside skill to use when, and how to judge the result. Before it, the method lived in one file, the choice of skills in another, the screen rules in the test docs and the review in a skill of its own, and a product that read only some of them repeated mistakes the others had already written down.

## What binds, in order

1. **The owner's words.** Taste, and any change to a written rule, is the owner's call. Put each visual question to them as specimens built in the product's real tokens, side by side, never described in words. `references/review.md` says how to sort a fix from an owner's call.
2. **The method** (`references/method.md`). Every kit and every screen satisfies it. A mock, prototype or artifact of a screen is high fidelity too: read the method, load the existing kit's CSS and compose it rather than imitate it, and check a screenshot against the method before the owner sees it. A product departs from a rule only by the owner's decision, recorded in its kit README with the reason. (`2026-11-03`, an evals product's artifact imitated its kit, invented borderless buttons and misaligned chips; its builder had read this page but never the method.)
3. **The product's kit**, three files wherever the product keeps them (often a `design/` folder): `tokens.css`, every raw value (colour, type, space, radius, duration); `kit.css`, the primitives, built from tokens only; and the **kit README**, the product's own design document: its direction, palette, type, layout and button roles, each with its reason, and every departure from the method. Screens compose the kit; a screen never invents a style.
4. **The collections advise** (`references/collections.md`). A suggestion reaches code only as a token or a primitive in the kit, recorded in the kit README. Where a collection disagrees with the method, the method wins.

**Every agent that builds the product's screens loads this skill from its installed pack, `app-stack`, and the product keeps no copy of it.** A copy freezes the method at the version it was taken from (the pack released three versions between `2026-11-02` and `2026-11-03`), and Claude Code loads it a second time beside the installed pack. A rule a builder can't load doesn't get read: a monitoring product's kit README pointed at the method in another repository, and the product shipped borderless Cancels in five places the method already forbade (`2026-10-22`).

**A builder that isn't Claude Code has the pack installed in it too.** Codex reads the same marketplace (`codex plugin add app-stack@product-engineering`), and a brief names the skill there as `$app-stack:design`: a headless `codex exec` loaded it once the pack was installed (`2026-11-03`, codex-cli 0.166.0). An agent with no plugin installer takes the folder through `npx skills add`, into its own skills folder only. Whatever a collection taught that the next screen needs goes into the kit README, not just the session that used it.

## Before any screen: the jobs map

Before a screen is drawn, a builder's included, work out what people come to do: one row per job, **the job in the user's words → the screen it happens on → the one question that screen answers → its primary action.** The map goes in the proposal's prototype and in every stage brief that adds screens. A screen with no job is cut; a job with no screen is a gap.

- **The product's data rules stay out of the copy.** The brief lists them (how records are split, sampled, versioned or locked), and a screen shows each only as an outcome in plain words: "12 traces wait for your review", never the table or the method's own vocabulary.
- **When the product replaces a tool the owner knows, that tool's structure is the default to generalize**, and each departure is justified in the kit README.
- **The example data fills every screen**, every tab included, so a click-through never meets an empty one; the empty states are shown on purpose, beside it.
- (`2026-11-03`, an evals product: its screens mirrored its tables and its method's vocabulary, and someone who knew the tool it replaced couldn't follow the process. The owner: "super technical, like a database".)

## A stage with screens is done only after the visual checks

**Before the owner's click-through:** the newcomer walkthrough below; the rendered-screen pass against `references/screens.md § What to verify visually`; the app-screen screenshot critique at 1440, 768 and 390, three rounds at most; and the scored Impeccable-style audit, with its P0 and P1 findings fixed. Both critique and audit are runnable from the checklists in `references/collections.md` without installing the collections. The owner then judges the look (`references/review.md`). (`2026-11-05`, an evals product passed the walkthrough and rendered pass but ran neither critique nor audit nor owner look review: control borders measured 1.61:1 against the method's 3:1, and the loudest colour on every healthy screen said *press* three or four times.)

(`2026-11-03`, an evals product: the design stage was skipped by a recorded decision, nothing brought it back, no screen was rendered and checked, and the owner's click-through found five layout bugs, most of them rules the method already had.)

### The newcomer walkthrough

**Give a fresh session only the ordered screenshots and the user's job**, never the brief or the code, or ask a person new to the domain. Ask the same questions for every screen: what is it for, what would you press next, and what is unclear? Fix any screen it cannot explain or next step it cannot find. Capture every route and every dialog with a Playwright crawl at 1280 and 390; crop pages taller than about 3,000px into ordered parts so the reviewer can read them without downscaling. For Clerk's test-user sign-in recipe, apply the `clerk-production` skill (`references/authenticated-mile.md`); other providers use their development test sessions. (`2026-11-04`, an evals product: a fresh `claude -p` session using this recipe found in about 20 minutes that no screen said how often each failure happened, a gap three review rounds missed.)

## Which collection leads, stage by stage

| Stage | Leads | Take | Keep out |
|---|---|---|---|
| **The jobs.** Before any screen | this skill, § Before any screen | the jobs map; the data rules kept out of the copy | a screen per table |
| **Direction.** No look yet; the look is the problem; a public page whose job is to persuade | `frontend-design` (always on) | a direction grounded in the product's subject; a plan (palette, type, layout, principles) checked against the generic defaults before anything is built; keeping brand colours still runs the kit stage | a new direction per screen. Once one is picked, it stops leading |
| **A choice between options.** A palette, a font pairing, a chart type, a stack's convention | UI/UX Pro Max | candidates to choose from. The pick goes into the kit by hand | its persisted design-system files and its installer: a second design system beside the kit |
| **The kit** | the method, with `frontend-design`'s plan | tokens and primitives that satisfy every rule in `method.md`, each held by a test where one can be written | anything a collection proposes that the method forbids |
| **Screens people work in.** Dashboards, admin, tables, settings | the app-screen checklist in `references/collections.md § Taste`, distilled from its last upstream app chapter | the screen's one question and face; every block's empty, zero, loading and error state; colour only on data, status and the one primary action; its screenshot critique, three rounds at most | Taste's current company-page system, and its palette and type when a kit exists |
| **Charts** | `dataviz` (built in) | form first, colour last; its palette validator; one axis; hover by default | state colours reused as series colours |
| **What a screen says** | `references/screens.md § What a screen may claim`, and `frontend-design`'s section on writing | sentences only as true as what the renderer is handed; one function for every summary of a state | — |
| **Before it ships** | `references/screens.md § What to verify visually`, then Impeccable | every width, state, theme and role; Pro Max's web checks (`quick-reference.md` §1–3, §8, §9) as a quick pass; Impeccable's audit, hardening and polish | Pro Max's native/mobile pre-delivery checklist for web work; Impeccable's commands that write their own design documents, and any redesign through it; ellipsis for text a person typed |
| **The owner judges the look** | `references/review.md` | measured claims, before/after specimens in the real tokens, fixes split from the owner's calls | opinions without numbers |
| **A page published as a claude.ai artifact** | `artifact-design` (built in) | its page contract and both themes | — |

`collections.md` has each collection's detail: what it is, what to take, what to keep out, how to install it, and a checklist usable without installing it. Without the third-party collections, design from the method, `frontend-design` and those checklists.

## The owner's standing preferences

**Yours go in the kit README** (for one product) **or in your user-level agent instructions** (for every product), in your own words, with the date you said each. An edit to the installed pack is lost at its next update. The entries below are the author's, kept as a worked example of what belongs there: a taste call with its receipt, and how far it reaches. Until you write your own, treat them as one owner's taste, not as rules.


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

Every screen answers a job on the map and passed the walkthrough, rendered pass, screenshot critique and scored audit with no open P0 or P1; the owner approved its look at phone and desktop width; and every raw style value comes from the tokens.

## When something is learned

- **True for any product:** a change for this collection, drafted in the product's feedback file or as an issue on the collection's repository (`/agent-harness:retro` says how), naming the file it belongs in:
  - a rule for the kit or for building screens goes in `method.md`;
  - a rule about what screens claim, or how they're checked, goes in `screens.md`;
  - a change to the review procedure goes in `review.md`.

  Give each its receipt: the date, and what happened, in a product named by kind, not by name. Hold it with a test where one can be written: a rule only in a report is gone by the next product.
- **True for this product only:** its kit README.
- **An owner preference:** the kit README, or the owner's user-level agent instructions, in their words (§ The owner's standing preferences).

## Where the method lives

- **In the installed `app-stack` pack, in every agent that builds screens**: Claude Code for the user, or with `--scope project` so every checkout of the product asks for it; Codex from the same marketplace; any other agent through `npx skills`. Each keeps it current with its own update command (the collection's README, § Install).
- **A product that still carries a copy** (`.claude/skills/design/`, `.agents/skills/design/`) **deletes it** once the pack is installed. Before that, `diff -r` against the pack's installed folder shows what the copy says that the pack doesn't: this product's lessons go to the kit README, the owner's preferences as above, and a lesson for any product to this collection (§ When something is learned).
- **Nobody edits the installed pack and hopes it travels.** A product's lesson goes into its own docs the day it is learned, and the general one goes to this collection as above (`2026-11-03`, an evals product).

## Files

| File | Holds | Read when |
|---|---|---|
| `references/method.md` | the rules every kit and screen satisfies | writing or changing a kit; building any screen |
| `references/collections.md` | each design skill collection: what to take, what to keep out, how to install it, its checklist distilled | choosing or running a collection, or working without one |
| `references/screens.md` | what a screen may claim; what to verify visually | changing what a screen says; before a release |
| `references/review.md` | reviewing a built product's look with its owner | the owner judges the look; a release's visual pass |
| `scripts/color.py` | OKLCH lightness, chroma and hue, and WCAG contrast (standard library only) | any question about a colour: measure it, don't describe it |
