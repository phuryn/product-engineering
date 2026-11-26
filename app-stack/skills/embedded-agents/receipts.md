# Receipts

## Draw the confirm card from what code stored, never from the model's text.

- `2026-10-09`, a support product's prototype defaulted its Confirm flag to false, so a tool ran unless the agent asked for confirmation. On `2026-10-11` the owner moved confirmation into the harness: “Confirmation is not an option… the harness surfaces them no matter who triggers them”. The owner also said, “The agent can see that email in its context, but it can't pass it to the tool” and, of a line listed as a guardrail, “That should be part of the support agent prompt, not something enforced”.

## Cap the whole message when an agent can call other agents.

- `2026-10-11`, an independent review of a support product found one message could start any number of agent runs. The product capped it at four specialist runs per message.

## Agree on an agent card with the owner before building the agent.

- `2026-11-25`, eight runs with the existing skills on the strongest model included propose-then-click and session-derived identity in eight of eight. Zero of eight gave a complete three-layer split or an agent card agreed before the build. Neither of the two proposals for a new idea included the exact tool list or the expiry, single-use and same-person rules for the button. No run supplied the code for the button.

## Let local tools read, show or propose and let the app confirm actions.

- `2026-11-25`, two listeners were attached to one conversation on localhost, and both ran the model's one call to a test card-charging tool: two charges. Checking who owns a conversation decides who may listen; it does not give each event to one listener. With a proposal tool in its place, the same call run three times left one confirm card, and three clicks at once ran the action once.

## Delete conversations when the person asks and when the account closes.

- `2026-11-25`, the first build of this wrapper deleted an owner's conversations in a loop. A live run answered 400 on the one still running, and the ones after it would have stayed. Deleting now stops a running conversation first.
