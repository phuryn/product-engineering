---
name: legal-pages
description: "Privacy policy, terms, a cookie banner, consent at sign-up, a public front door: legal pages drafted from what the code does while it is built, held to it by a test, with the owner's facts and sign-off."
---

# Legal pages: drafted from the code, held to it

A privacy policy is the one document where a confident guess is a legal problem: a page that promises a deletion the code does not do is the one a customer's counsel reads. So the pages are built like the rest of the product, while it is built: the agent drafts them from what the code collects, stores and sends, a test fails when the code and the pages part, and the owner supplies the facts only they have and approves the text. This is a method for keeping legal text true, not legal advice; the owner, or their counsel, decides what the pages say.

It was learned on a monitoring product and a live Q&A product, named here only by kind.

## When it applies

- **During the build, before the first stranger is asked for anything**: a sign-up, an email address, a payment. The pages land with the public front door, and until then the deploy's URL is shared with nobody (for a SaaS, stage 8 of `app-lifecycle`).
- **In the change that alters what a page describes**: a new provider, an analytics tag, a cookie, a retention job, a model provider that reads what people type. The page changes in the same change, never before it and never after.
- **At go-live**, the `release-gate` skill confirms they match the code; at a review, the `intended-vs-implemented` skill reads them as documented intent. Neither is where they are written.

## What binds

1. **Every sentence matches what the code does today.** Each claim traces to a table, a cookie, a script or a provider call, and nothing describes a tag, a job or a feature still to come. The policy names an analytics tool only in the change that adds its tag. (The live Q&A product's original ask requested the analytics sentence before the tag existed: exactly the overclaim this rule forbids.)
2. **Draft from an inventory of the code, not from a template.** List what is collected and from whom, where it is stored and for how long, and every provider it reaches, from:
   - the environment schema's providers and the server's outbound calls;
   - the Content-Security-Policy's origins, which name every third party a browser page may reach;
   - the tables that hold personal data, and what each column is for;
   - the cookies a visit sets: a browser test reads the cookie jar after every public page;
   - the scheduled jobs that delete or expire data;
   - what people type to an embedded agent, which reaches the model provider under its own retention terms.
3. **When another product by the same company already has legal pages, start from them.** Keep the company's boilerplate (controller, rights, supervisory authority, governing law, accounts, acceptable use, payment, liability) and rewrite everything about processing from this product's inventory.
4. **A unit test pins the pages to the code.** The policy's list of providers lives in code beside the pages, and the test fails when the code reaches a provider the list does not name, or when an area the pages call unbuilt ships.
5. **Sell only what runs.** The plan table, the terms, the policy and the footer read one launch list of what is built, and a test fails when a sold or promised line names something the list marks unbuilt; that line says *Coming soon* instead. (`2026-10-23`, a monitoring product's paid plan was found selling four capabilities that were not built.) The go-live side of the same check is `release-gate`.
6. **No page promises a deletion no job performs.** A retention period on the page needs the job that enforces it, idempotent and with no public endpoint; until it exists, the gap is logged in the backlog and the page promises nothing.
7. **Essential cookies only, so no banner.** Sign-in, a theme and security cookies are essential; analytics, advertising and most chat widgets are not. Any cookie that is not essential brings the consent banner with it: nothing non-essential loads before the visitor accepts, refusing is as easy as accepting, and the policy names the cookie, its purpose and its lifetime. Analytics runs without cookies by default (the `product-analytics` skill), which is how a product ships with no banner.
8. **Express consent at sign-up.** A new account accepts the terms and the policy before it exists, through the identity provider's own setting where it has one (on Clerk, *Require express consent to legal documents*, switched on by the owner; `clerk-production`). Each page carries its last-updated date.
9. **A contact address only once the mailbox exists.** Until then the pages show the postal address alone, which is honest: an address that bounces is worse than none (`environments`, optional feature switches).
10. **The pages are public and read no session.** They render the same for everyone, signed in or not, and every page links to them in its footer, the sign-up included.

## What the owner does by hand

The agent drafts, inventories, writes the test and wires the links. These are the owner's, and the agent asks for each by name rather than guessing:

1. **The controller**: the legal entity's full name, its registered address and, where one exists, its company number.
2. **The contact**: an address that receives mail, or the decision to show the postal address alone for now.
3. **The provider details**: for each provider the inventory found, confirm the account it runs under, the region its data is stored in, and that its data processing agreement is accepted (usually a click in its dashboard).
4. **Where the product is offered**, the governing law and the supervisory authority.
5. **Retention**: how long each kind of data is kept. The agent then builds the job the period needs (rule 6).
6. **The identity provider's consent setting**, switched on in its dashboard (rule 8).
7. **Approve the text**, read in full. Nothing is published without that approval.

## How you can tell it worked

The test fails when a scratch change calls a provider the policy does not name, a visit to every public page leaves only essential cookies in the jar, a stranger signing up on a phone must accept the terms and the policy first, and the owner approved the text with their own facts in it.

Related skills: `product-analytics` (cookieless analytics, and what changes when a cookie comes in) · `app-lifecycle` (where the front door sits on the path) · `release-gate` (the go-live check that the pages match the code) · `intended-vs-implemented` (the pages read as documented intent at a review) · `environments` (what is held about people, data that expires) · `clerk-production` (the consent setting, the CSP) · `design` (what a screen may claim).
