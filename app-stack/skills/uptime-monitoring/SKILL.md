---
name: uptime-monitoring
description: "Publishing an app, adding /health or a cron job, 'set up monitoring', 'is it down': content checks, a second location, heartbeats, a tested alert route."
---

# Uptime monitoring — know it's down before its users do

A product in production needs someone outside it watching: checking that it answers and works, from more than one place, and telling a person who can act. This skill is how to set that up so it holds, on any monitoring service, and how to tell it is done. The lessons come from building a monitoring product (`2026-10`); `references/staygreen.md` is one service's adapter.

**When:** the first deploy (re-pointed at go-live), every new scheduled job, every new runtime beside the app (a worker, an agent host, a second service), and whenever someone asks whether the product is down. For a SaaS on this collection's stack, it is the Publish stage of the `app-lifecycle` skill.

## What holds, on any service

1. **One location is a false-alarm machine.** A network blip between one checker and the host looks exactly like an outage. **Confirm a failure from a second location before anyone is woken up.**
2. **"Up" is not "working".** A page that answers 200 can sit on failing payment webhooks, a paused database, a certificate or domain about to expire, or a sign-in provider that is down. **Check content, not the status code**: a `/health` that proves the database answered, with the check asserting on that field. Watch certificate and domain expiry, and the dependencies the product can't work without.
3. **Scheduled jobs fail silently.** Nothing calls a job that never ran. **Each job pings a heartbeat when it succeeds**, and the monitor alerts when the ping doesn't arrive within its grace period.
4. **A monitor running on what it monitors can't vouch for it.** If the product and its monitor share a host, a database or a region, the outage that matters takes both down. Run checks and the status page outside the product's infrastructure. (`2026-10-27`, a monitoring product: its own status page ran on itself; its support page said so, and an independent witness was not yet set up.)
5. **No alert route is the default failure.** A monitor that tells nobody is decoration. **Setup is done only when a controlled failure has reached the person who should act, and the recovery notice has too.**
6. **Heartbeat URLs, monitoring tokens and webhook URLs are secrets.** Anyone holding a heartbeat URL can report a dead job alive. Never put one in a chat, a commit, a log or a command; keep it with the product's other secrets (the `environments` skill). When a tool returns one to the agent, it goes straight into the secret store and is used through its variable from then on (`$JOB_HEARTBEAT_URL`), never repeated. Issuing a new one doesn't always retire the old: check, and rotate when one was exposed.
7. **Uptime with gaps is not 100%.** Minutes with no check are unknown, not up, and a paused monitor measures nothing. **Report the time covered beside every percentage.**

## Setting it up

1. **Know what the product depends on:** the public URL and `/health`, the database, the identity provider, payment webhooks, every scheduled job, every other runtime. Each gets a check or a heartbeat.
2. **Decide what the status page shows, before anything is created:** public, members-only or none, and which components. A public page is something the product publishes, so it is the owner's call; on some services creating the app creates its public page in the same call. Tell the owner what it would show: often only the website's state, with every other monitor private and still readable on the dashboard or through the agent. Scheduled jobs and internal services usually stay off a public page.
3. **Reconcile before creating.** List the monitors that already exist and compare their targets with what you are about to add. A create whose answer was lost (a timeout, a dropped connection) is read back before it is retried, and retried with the same idempotency key where the service takes one. A transaction is not evidence that a retry is safe.
4. **Create the checks:** content on `/health`, certificate and domain expiry, a heartbeat per job, the dependencies, an outside check on each other runtime. Store every heartbeat URL as a secret the moment it is returned. Where the service's one create call would publish a page the owner declined, the owner creates that part on the service's dashboard and the agent continues from there: declining a page never means going without a monitor.
5. **Set the alert route**, with the owner: who gets alerts, and through which channel. On many services channels are a dashboard step only a person can take; say so and wait for it.
6. **Prove it.** Cause a failure on purpose and watch the alert arrive where it should, then end the failure and watch the recovery arrive. A check that fails from everywhere (a path that answers 404 where 200 is expected, an assertion that can't match) exercises the second-location confirmation too. **A heartbeat that has never been pinged may never alert**: on at least one service its deadlines start at the first ping (read `2026-10-27`), so ping it once, then miss a run. Ping it the way the job will, through the stored secret (run the job once, or `curl -fsS "$JOB_HEARTBEAT_URL"`), never with the URL typed into the command. Clean up what the test created, or pause it and ask the owner to remove it where an agent can't. Until this has happened, the setup is reported as **not yet proven**.
7. **Record it** in the product's environment record: each monitor and its target, where alerts go, what was proven and on which date.

## Reporting status

Say what was checked, from where, and over what time covered. "Down" and "unknown" are different answers; so are "up" and "not checked yet". A status page that has not run its first check yet is not "all systems operational".

## How you can tell it worked

A controlled failure, confirmed from a second location, reached the person who should act, and its recovery did too; every scheduled job has a heartbeat; and every uptime figure reported comes with the time it covers.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/staygreen.md` | one service's adapter: connecting an agent, its tools mapped to the steps above, what it can't do, what has and hasn't been tested. Disclosure: the service is made by this collection's author | using that service, or comparing one |
