# Reviewing a built product's look

When the owner judges what is built — "okay but not stunning", a product they admire, a question about borders, buttons or colour — or before a release's visual pass. **A design review produces decisions, not opinions.**
- Every claim is measured.
- Every recommendation the owner sees comes with a before/after built from the product's real tokens.
- Every change is sorted into one of two kinds:
  - **a fix:** an inconsistency, or a breach of the method or the product's kit. Fixes get built;
  - **the owner's call:** taste, or a change to a written rule. These wait for the owner.

That split is what let an owner answer seven questions in one message rather than in a conversation per adjective (`2026-10-22`).

## First: is the method in the product?

Check that the method (`method.md`, or an older copy of it inside the product's design README) is **in the product's own repository**, copied, not linked.

A monitoring product's design README said the method "applies unchanged" and pointed at it in another repository, which no agent working in the product ever opened. The method already said "Cancel is always the secondary", and the product still shipped borderless Cancels in five places (`2026-10-22`). A rule another product already paid for costs the full price again when this one only points at it.

## The procedure

1. **Answer the owner's questions first, in their words.** Quote each one. Give a verdict in one sentence, the evidence, and the change as `file:line` before → after. Everything else in the review comes after those answers.
2. **Capture every main screen.** That means light and dark, at 1440 and at 390 wide, in the healthy state and in a problem state, plus close-ups of the components in question.
   - Data-dependent states come from the product's real components on a temporary local route with fake data.
   - **Never write to shared test accounts or the owner's workspaces** to stage a screenshot. A reviewer that seeded monitors into the test gate's account failed a gate run mid-review (`2026-10-22`).
3. **Measure, don't describe.**
   - Sample pixels from the owner's reference screenshots.
   - Run `scripts/color.py` on every colour in question, for OKLCH hue, chroma and lightness and WCAG contrast.
   - When the product the owner admires (the reference) is open source, read its theme and component source for the exact recipe. Supabase's UI is: `packages/ui/build/css/themes/light.css`, its card and radio-group components.
   - The session that presents the review recomputes the headline numbers itself, whoever wrote the report.
4. **Count the colours of a healthy day.** List the most saturated things on the main screen when nothing is wrong, and what each one says. If the loudest colours say "press" and "beware", the product can't feel reassuring however good its parts are. This one count explained most of "okay but not stunning" in a dashboard whose healthy overview's loudest colours were its blue button, a lavender nav item, and amber and red icons on tiles counting zero.
5. **Run every rule in `method.md`** against the screenshots and the code, and every check in `screens.md`. The ones past reviews caught:
   - tints that drifted off the accent's hue;
   - the accent on the current nav item;
   - alarm icons at zero;
   - borderless Cancels;
   - a left bar drawn as an inset shadow;
   - flag emoji;
   - mono URLs;
   - twelve boxes in three styles;
   - summaries of one state computed in several places.
6. **Build a specimen for every recommendation.**
   - Before and after, side by side, in the product's real token values.
   - Each specimen is scoped (one class prefix, its own variables), so a set of them assembles into one page.
   - Publish that page where the owner can open it on a phone, as an artifact. Specimens decide faster than prose.
7. **Sort fixes from owner's calls.** The test: does the change contradict something written, or is it taste? If either, it's the owner's call. Give each one a recommendation (do it / try it / don't) and what it goes against, and ask for the answers in one message, by number.
8. **Build the fixes, and hold each rule with a test** where one can be written: a source scan, as the colour-literal guard is, or a pinned pair in the token test. Write each rule into the method (general) or the product's kit README (this product only), with its receipt. A rule that only exists in a review report is gone by the next product.
9. **Review the change independently**, like any other code. Presentation changes misstate state.
   - A new green mark beside an existing all-clear headline showed for a monitor that hadn't been checked yet. Two more rounds each found another sentence on that screen disagreeing with it (`2026-10-22`).
   - When a change touches one sentence about state, the brief asks for an audit of **every** sentence on that screen about the same state.
10. **Record every owner decision, including a no, with its reason**: in the product's decision log, and under the owner's preferences in `SKILL.md` when it is a preference rather than a product choice. A rejected recommendation without its reason comes back in the next review.

## The report

Write `report.md` in this order:
1. **The short version:** the diagnosis in a paragraph.
2. **The owner's questions,** each with its verdict, evidence, change (before → after with `file:line`) and specimen.
3. **A comparison table:** where the reference does better, where we do, and what doesn't apply to us.
4. **Further recommendations,** ranked by impact on what the owner said, each with effort and its risk to the written rules.
5. **Owner decisions in one table:** the change, what it conflicts with, and the recommendation.
6. **What couldn't be checked, and why.**
7. **Sources,** marking which were verified first-hand.

Put the specimens in `mockups.md`, rendered together in one HTML page. Put the screenshots in `shots/`, named `<screen>-<light|dark>-<desktop|phone>.png`.

## Delegating it

- The reviewer is the strongest model available. This is judgement work.
- Give the reviewer the owner's screenshots, the repository, the product's design README, the questions in the owner's words, the location of a running dev server (read-only), and the no-writes rule for shared data.
- The session agent:
  - verifies the key numbers with `scripts/color.py`;
  - builds the owner-facing page from the specimens;
  - delegates the fixes as a separate build;
  - runs the independent review on that build.
