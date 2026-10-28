---
name: transactional-email
description: "Adding transactional or alert email, choosing a provider, 'sent twice', 'never arrived': send app email without losing or doubling it, with one-click unsubscribe."
---

# Transactional email: durable receipts, honest about duplicates

An app that sends email has two ways to fail its users: a message that should have gone and didn't, and the same message twice. A plain "insert, then call the provider" does both, depending on where it crashes. This skill is the shape that loses nothing and sends a duplicate only in a narrow, named case, plus the unsubscribe, environment and domain rules that go with it.

It was learned on a monitoring product that sends alert email (an incident opened, an incident resolved, a test) through **Postmark**, over its HTTP API with plain `fetch`, from a scheduled sender, named here only by kind. The mechanics carry to Resend, SES or any provider with an HTTP send API; where providers differ, both are said, with the date they were read. The identity provider's own email (sign-in codes, invitations) is not covered here: it sends that itself.

**Terms used here.** An **event** is the thing that happened (an incident opened, an invoice paid). A **message** is one email about it to one recipient. A **receipt** is the durable row that says what became of that message. The **sender** is the code that turns pending receipts into provider calls, wherever it runs.

## What binds

1. **The event and its pending message commit together.** An outbox row is written by a trigger on the event's table, in the transaction that writes the event: an event never exists without its pending message, and an event that rolls back never sends. Code that inserts the event and "then queues the email" has a crash window between the two. (`2026-10-22`, a monitoring product: its incidents table's trigger adds the alert to an outbox. Its writers were the owner of its definer functions and the server's secret key, which could already insert the outbox, so they needed no change and gained no privilege. A restricted writer needs a definer trigger: `references/delivery.md § The outbox`.) The outbox row is unique per event and kind, so a trigger that fires twice still queues one.
2. **One receipt per message, unique, written before anything is sent.** The unit is event × channel × recipient, with a unique constraint, so expanding an event into its receipts twice adds nothing. Recipients are resolved at send time, from the identity provider for members, and a receipt holds the member's id, never their address. If the identity provider can't be read, the event waits; it is never expanded into an empty list. → `references/delivery.md § The receipt`
3. **Claim under a lease, send only while the claim is fresh, mark only while it is still yours.** The sender claims due receipts with `for update skip locked`, so two senders never claim one, and a pass may run any number of times, overlap another, or be missed and caught up later. It sends only well inside the lease, so a sender that stalled cannot send a receipt another has since taken over, and it marks a receipt only if the claim is still its own. → `references/delivery.md § The claim`
4. **Classify the provider's answer, because each answer means something different:**
   - **accepted** (a message id): `sent`, with the id;
   - **refused this message** (an invalid address, an inactive recipient): `failed`, in your own words, never retried, because sending it again can't help;
   - **didn't take it** (a 429, a 5xx, a refused token, or the request never left): back to `pending`, with backoff, and `failed` after a fixed number of tries;
   - **no answer** (a timeout, a dropped connection, a crash between the provider accepting and your mark): it stays `sending`, and nobody knows whether it went. That case is item 5.
5. **An unanswered send is settled, never resent blind.**
   - **Where the provider takes an idempotency key, send one**, the receipt's id. Resend accepts an `Idempotency-Key` header and keeps it for 24 hours: a retry with the same key and body returns the first answer without sending again (Resend's docs, read 2026-10-25).
   - **Where it has none, put the receipt's id in the message's metadata and ask the provider's message search** before sending again. Postmark has no idempotency key (its support article, read 2026-10-25), so a retried `POST /email` is a second email; `GET /messages/outbound?metadata_<key>=<receipt id>` answers whether it was accepted.
   - **Ask only after the lease has run out**, never straight after the send: the search lags acceptance and flickers before it settles. (`2026-10-22`, a monitoring product's drill against the real API: a message first appeared 4 to 10 seconds after acceptance, then answered found and not found by turns for a few seconds more. An earlier version of the drill asked as soon as the message first appeared, got "not found" on the next call, and sent a second copy.)
   - Found: mark it `sent` with that id. Not found: send it. The search itself failing: wait.
6. **There is no exactly-once. Name what remains.** A duplicate can still go out if the provider accepts a request long after the sender gave up on it (beyond the lease, or beyond an idempotency key's lifetime), or if the search has not settled by the time it is asked. Neither was seen in the product this came from, but its own notes say both can happen. So the design says *at least once, with duplicates made rare*, and nothing in the product's copy, docs or terms promises more. A channel that cannot be asked at all (a chat API with no search) goes the other way: an unanswered send is marked failed with words saying it may have arrived, and is never sent again, so it is *at most once*. Choose per channel, and write down which. → `references/delivery.md § What remains`
7. **Unsubscribe is one-click by POST, and a GET never acts.** Every message that can be unsubscribed carries `List-Unsubscribe: <https://…/unsubscribe/<token>>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058). → `references/delivery.md § Unsubscribe`
   - **Mail scanners open links.** So the one-click address acts only on a `POST` whose body is `List-Unsubscribe=One-Click`, answers it directly (RFC 8058 forbids a redirect), and needs no cookie or sign-in, because the token is the authority. A `GET` to it goes to a page that checks the token, shows what will stop, and asks. (`2026-10-22`, a monitoring product: a review found the one-click route acting on a `POST` without RFC 8058's body; it now refuses one.)
   - **The token is an HMAC of the receipt's id**, deterministic, so a retried send carries the same link. It stops only what that receipt reached. **Rotating its secret breaks every link already sent**, so that secret is rotated only after a leak.
   - The headers must be covered by the message's DKIM signature, or receivers may not offer one-click.
8. **An address someone typed gets one confirmation email, and nothing else until it is confirmed.** The confirmation link carries a random token stored only as a hash, expires (days, not weeks), and is confirmed by a button press, not by opening the link. Confirmation emails have their own sending budget, per member and per workspace, because they are the one email the app sends to an address it does not know.
9. **One provider server (or account, or project) and token per environment.** Development's token never sends to customers, and production's is never in a development file. Rotate a token **on the same server**: reconciliation searches one server's history, and a new server cannot find what the old one accepted. (`2026-10-24`, a monitoring product gave production its own Postmark server and token at go-live.)
10. **Development sends every email to the provider's discard address, and production refuses that setting.** A development-only redirect (Postmark: `test@blackhole.postmarkapp.com`, which accepts and never delivers; Resend: `delivered@resend.dev`, which simulates a delivery) sends alerts, confirmations and tests alike there instead of to their recipient. Each receipt records that it was redirected, and the screen says so. **The production build, and every production deploy of the sender, refuse a non-empty redirect**: a convention alone lets a copied `.env` send every customer's email to one address. (`2026-10-23`, a monitoring product's backlog: nothing refused its redirect in a production build or the production sender's deploy, and its pre-go-live box for it was still unchecked a day later.) The general rule for development-only switches is `environments`.
11. **Tracking off on every message**, not only on the server: no open pixel, no rewritten links, set in each send call (Postmark: `TrackOpens: false`, `TrackLinks: "None"`), so a server setting changed later cannot add them. Plain text unless the product needs more. The footer says, in words true for that recipient, why they get the message.
12. **Logs hold ids and counts, never bodies, recipients or the provider's response body.** A receipt holds the provider's error number and your own words for it.

## Setting it up

- **The sender domain**: SPF, DKIM and the provider's return-path (bounce) record, all DNS-only, verified in the provider before the first send. **DMARC at `p=none` with no reporting** is where most setups stop; it lets anyone spoof the domain, so rank it as a risk and tighten it once mail flows. (`2026-10-24`, a monitoring product's infrastructure pass listed its monitoring-only DMARC among the defaults to tighten.)
- **A new provider account may be restricted.** Postmark refused mail to other domains with error 412 until the account was approved (observed `2026-10-22`); the code reports that in plain words rather than failing silently.
- **The variables**: the provider token and the sender address are a pair, both set or both empty; the unsubscribe secret is generated, and is one of the keys that cannot be replaced without breaking what was already sent (`environments`). The redirect is development-only (item 10).
- **Where the sender runs**: anywhere a schedule can call it (a cron on the app's host, a Worker, a worker). A runtime other than the app gets its own database login with only the sender's functions (`supabase-production § A second runtime`), and is deployed separately, because a push redeploys only the app (`release-gate`). Overlapping senders are safe by item 3, which is what makes a cut-over from one runtime to another safe.

## Proving it

- **Integration tests against a real Postgres with every migration**, through the sender's real functions: a retried send; a dropped answer settled by the search with no second send; a crash before the provider; several senders racing over many receipts, each sent once; a refusal not retried; a stale claim that never sends; a follow-up never sent after its first failed. → `references/delivery.md § Tests`
- **A drill against the provider's real API**, to the discard address only, before production: one event, one message, a second pass that sends nothing, and a simulated crash after the send that must be settled from the search without a second copy. The drill waits until the search has answered *found* several times in a row before the next pass, which is what the lease buys a real sender. (`2026-10-22`, a monitoring product's drill found the search's flicker this way.)
- **Production's own drill** before customers rely on it. (`2026-10-24`, the same product listed "production's alert path never drilled" as a top risk: the first real incident would otherwise be the first test of delivery.)

## How you can tell it worked

A real message reached a real inbox once, a retry did not send a second, and one-click unsubscribe worked from the message as received.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/delivery.md` | the outbox and receipt schema, the claim and its timings, the answer table, reconciliation, what remains, ordering between related messages, unsubscribe in detail, the tests | building or changing the sender; a duplicate or a missing email; choosing lease and timeout values |

Related skills: `environments` (one value per environment, development-only switches, rotating a secret across every holder) · `supabase-production` (a second runtime's database login) · `release-gate` (deploying the runtimes a push does not) · `saas-authorization` (what may be stored about people; reading names and addresses at send time).
