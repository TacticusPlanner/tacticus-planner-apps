# Proposal

## Why

`add-quest-event-tracker` gives the Quest tab its points total and crate count, but it does not say what the crates hold, what the medals are worth in featured-hero shards, or whether the player has enough tokens left to fix the battles that are not perfect. Those are the next questions a player asks during the 72 hours: "is crate 14 worth chasing", "will this unlock Nubari", and "can I still replay everything". Tokens are not in the game API (confirmed), so the plan works from an optional "tokens now" entry.

## What Changes

- **Rewards card** on the Quest tab: the 17-crate track with each crate's rewards and the crates opened so far; featured-hero shards earned (1 per medal, 51 max) with a **Quest Bundle** toggle that triples them (153 max), stored per occurrence; and what the shards mean for the featured hero: unlock, or the stars and ascensions they cover, from the catalog shard costs.
- **Shard goal hook**: "Create goal" opens the Create goal sheet prefilled for the featured hero (Unlock when not owned, else Ascension to the step the maximum shards reach). If an active Unlock or Ascension goal for that hero exists, it shows "Open goal" instead.
- **Token plan**: attempts left until the end, from an optional "tokens now" entry (bank max 6, +1 every 2 hours), compared with the battles still below their maximum. It warns when the bank will fill before the player's next likely login, and tips to log in at least every 12 hours.

## Capabilities

### New Capabilities

- `quest-event-rewards`: the crate track, shards earned and reachable, the bundle toggle, the shard meaning and the goal hook.
- `quest-event-token-plan`: the tokens entry, attempts left, the comparison with battles to improve, and the bank-full warning.

### Modified Capabilities

None. The cards are placed on the Quest tab as their own requirements state.

## Impact

- Apps only; no companion `tacticus-planner-api` change. It reads `quest-crates`, `unlock-shard-costs` and `ascension-costs`, already served.
- Depends on `add-quest-event-tracker` (the tab, `scoreQuest` and the storage entry).
- `features/quest-event` (rewards and token models in `.ts`, two cards), the storage entry gains `bundle` and `tokens`, `features/goal-create` launcher (prefilled Create goal), `quest-page.tsx` and its tutorial, `quest` locales in four languages.
