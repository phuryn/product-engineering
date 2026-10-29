# product — deciding what to build

Before an agent builds anything: who it is for, what they need that nothing serves well, how the product compares with what they use today, which segment to win first, and how it will grow. What these skills produce is a draft the owner confirms, not a decision.

**Start with `/product:start-here`** (Codex: `$product:start-here`): say what you have, and it names the next step along the lifecycle and the skill for it, in this pack or another.

## Install

```bash
claude plugin marketplace add phuryn/product-engineering
claude plugin install product@product-engineering
```

Codex, Cursor and other agents: see the collection's root `README.md`.

## Skills (8)

**You start it:**

- **start-here** — Where the work stands and what comes next, from a new idea, new evidence, an agreed change, a bug or a release: the next step, the skill that does it, and the plan prompt for a complex change (key assumptions first, then what to implement, how to test it, acceptance criteria). Only when you start it.

**They start on their own**, in the order they are usually used:

- **propose** — Research an idea or a product's next step and propose what to build: it reads what you shared, looks for what's missing (alternatives, the market, what people say), marks every claim by its source, and ends in a prototype you review, interface first. It asks only what the evidence can't decide, and runs again once people have used the product, with what they did.
- **competitor-analysis** — The competitive landscape: five direct competitors, their strengths and weaknesses, and where to differentiate.
- **market-segments** — Three to five customer segments, each with its jobs to be done, desired outcomes, pains and product fit.
- **beachhead-segment** — The first segment to win, scored on burning pain, willingness to pay, winnable share and referral potential (Geoffrey Moore's *Crossing the Chasm*).
- **value-curve** — Your product against competitors and substitutes, scored on the 5-7 needs one segment cares about most, plus relative price: where to be far ahead, where parity is enough, and what you deliberately don't compete on.
- **value-proposition** — The 6-part value proposition (Who, Why, What before, How, What after, Alternatives) by Paweł Huryn and Aatir Abdul Rauf, ending in a statement ready for marketing, sales and onboarding.
- **growth-loops** — Growth loops (flywheels) that compound: viral, usage, collaboration, user-generated and referral.

Five of these began in the free [pm-skills](https://github.com/phuryn/pm-skills) collection and stay MIT; `start-here`, `propose` and `value-curve` are new. If you also have pm-skills installed, its copies of the five carry the same guidance, so your agent may see each one twice.

For additional discovery, prioritization, experimentation and go-to-market techniques, see the free [PM Skills collection](https://github.com/phuryn/pm-skills).

## Further reading

- Research and segments: [Market Research: Advanced Techniques](https://www.productcompass.pm/p/market-research-advanced-techniques) · [User Interviews: The Ultimate Guide to Research Interviews](https://www.productcompass.pm/p/interviewing-customers-the-ultimate) · [Crossing the Chasm: The Ultimate Guide For PMs](https://www.productcompass.pm/p/crossing-the-chasm)
- Value proposition and value curve: [How to Design a Value Proposition Customers Can't Resist?](https://www.productcompass.pm/p/how-to-design-value-proposition-template) · [How to Achieve Product-Market Fit? Part I: Market and Value Proposition](https://www.productcompass.pm/p/how-to-achieve-the-product-market) · [Jobs-to-be-Done Masterclass with Tony Ulwick and Sabeen Sattar](https://www.productcompass.pm/p/jobs-to-be-done-masterclass-with) (video course) · [Product Innovation Masterclass](https://www.productcompass.pm/p/product-innovation-masterclass) (video course)
- Go-to-market and growth: [5 GTM Principles You Should Know as a PM](https://www.productcompass.pm/p/5-gtm-principles-with-frameworks-templates) · [Product-Led Growth 101, Part 1/2](https://www.productcompass.pm/p/product-led-growth-101-12) · [OpenAI's Product Leader Shares 3-Layer Distribution Framework To Win Mind & Market Share in the AI World](https://www.productcompass.pm/p/distribution-framework-ai-products)

## Author

Paweł Huryn — [The Product Compass](https://www.productcompass.pm)
