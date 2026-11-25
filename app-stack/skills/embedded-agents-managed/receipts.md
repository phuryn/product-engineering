# Receipts

## Let local tools read, show or propose and let the app confirm actions.

- `2026-11-25`, two listeners were attached to one conversation on localhost, and both ran the model's one call to a test card-charging tool: two charges. Checking who owns a conversation decides who may listen; it does not give each event to one listener. With a proposal tool in its place, the same call run three times left one confirm card, and three clicks at once ran the action once.

## Delete conversations when the person asks and when the account closes.

- `2026-11-25`, the first build of this wrapper deleted an owner's conversations in a loop. A live run answered 400 on the one still running, and the ones after it would have stayed. Deleting now stops a running conversation first.
