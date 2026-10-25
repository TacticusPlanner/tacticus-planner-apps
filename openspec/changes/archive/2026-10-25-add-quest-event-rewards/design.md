# Design

## Context

- `add-quest-event-tracker` provides `scoreQuest`, the per-occurrence storage entry and the Quest tab layout.
- `quest-crates` (17 records, structured rewards) comes from the companion API change of the tracker. `unlock-shard-costs` and `ascension-costs` are already served and used by goals.
- `features/goal-create` exports the Create goal launcher used by other pages.

## Goals / Non-Goals

**Goals:** answer "what do I get", "what do the shards do", and "can I still fix everything" without leaving the tab.

**Non-Goals:** projected rewards from clear estimates (added by `add-quest-event-clear-estimates`), synced tokens (not in the API).

## Decisions

### D1. Rewards and tokens are pure functions over `scoreQuest`

`questRewards(score, crates, bundle, hero)` and `questTokenPlan(score, entry, occurrence, now)` live in `features/quest-event/model` as `.ts` files. The cards only render their results. The clear-estimates change later passes a projected score into the same functions.

### D2. Shard meaning reuses the goal cost tables

The walk over `ascension-costs` is the one goals already use for shard need, called with "shards available" instead of a target. That way the card and a created goal always agree.

### D3. The goal hook opens, never writes

The card only opens the Create goal sheet (prefilled) or the Edit dialog. Saving stays in `goal-create`, so validation, priorities and projects behave as anywhere else.

### D4. Conservative token math

Not knowing the regen phase, the plan restarts the timer at the entry. That undercounts by at most one token. The plan never claims more attempts than the player has.

## Risks / Trade-offs

- [A stale "tokens now"] → the card shows "as of {time}", and a new entry replaces it.
- [The bundle rule changes] → it is one multiplier constant.
- [The crate table is wrong] → it is API data; fixing it is a content-only catalog change.
