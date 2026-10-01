## Why

Unlock goals cannot be created for characters whose only shard source is a shop. Kharn and Ragnar have no campaign shard-farm nodes (`shardLocations: []`) but are sold as shards in the Guild War shop (and the Rogue Trader shop), so the Unlock goal type is disabled with "Unlock is unavailable because this character has no catalog shard locations." Reported on Discord; reproduced locally by marking Kharn as not owned. The gate in `use-entity-shard-summary.ts` predates the Campaigns/Onslaught/Shops acquisition-source picker and was never updated to count shop offers.

## What Changes

- The Unlock goal type is available for an unowned Character when it has at least one campaign shard-farm node **or** at least one regular (non-mythic) shop shard offer.
- The disabled-state message is only shown when the character has neither source.
- The API enforces the same rule server-side (`IsUnlockEligible` requires campaign nodes) and rejects the create with 400, so the companion API change must land too.

Companion API change: `fix-unlock-goal-shop-only-sources` in `tacticus-planner-api` (applies first).

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `goal-creation`: adds a requirement defining when the Unlock goal type is offered for a Character (campaign nodes or shop shard offers).

## Impact

- `apps/web/src/fsd/pages/goals/model/goal-creation-form/use-entity-shard-summary.ts` (gate) and `use-create-goal-form.ts` (pass shop offers in).
- Tests for the gate and the create-goal sheet.
- No data or dependency changes. Depends on the companion API change for the create to succeed.
