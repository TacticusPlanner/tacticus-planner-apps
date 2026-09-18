## Why

Two in-app feedback reports show Daily Raids sending players to the wrong battle for a material they need: it recommends an event-campaign Extremis node the player hasn't actually reached, and when two nodes are equally efficient it doesn't prefer the one that pays more gold the way V1 does. Both are recommendation-quality bugs in the same shared farming engine Today, Bonus Raids, and Raids Plan all consume.

## What Changes

- **Event-campaign nodes the player hasn't reached are no longer treated as farmable.** Today already syncs `campaign-events-progress` (a per-tier, per-campaign completed-battle high-water mark) for the Progress page; the shared farming engine currently ignores it and instead infers "farmable" from the ambiguous, tier-blind `live-progress.battleAttempts` data, so an unreached Extremis node reads as available. The engine will additionally require an event-campaign battle's node number to be within the player's completed-battle count (or the next uncompleted one) for its own `{campaignGroupId, type}`, before it's eligible for raid calculations at all — on top of the existing "active event" gate.
- **When multiple farm locations tie on farming efficiency (`energyCost / dropRate`), the tied location with the higher expected gold reward is preferred**, matching V1's `selectBestLocations` tie-break (`orderBy(['energyPerItem', 'expectedGold'], ['asc', 'desc'])`). Currently a tie resolves to whatever order the locations happen to be indexed in, which is why a lower-value node can beat a higher-value one that's otherwise identical.
- Depends on the companion `tacticus-planner-api` change (same change name) serving `expectedGold` per farm location — see that repo's proposal.

## Capabilities

### Modified Capabilities

- `daily-raids-today`: "Only the active campaign event is farmable" gains a second eligibility condition (tier-reached, from `campaign-events-progress`) alongside the existing active-event-id check; a new requirement is added for farm-node selection (min energy-per-item, tied nodes broken by expected gold) — currently unspecified, silently implemented by the shared engine. `daily-raids-plan` explicitly reuses "the same shared engine" as Today, so no separate delta is needed there.

## Impact

- `apps/web/src/fsd/features/daily-raids/model/daily-raids-calc.ts` (`availableCampaignBattles`) and `apps/web/src/fsd/features/daily-raids/model/use-daily-raids.ts` (where `availableCampaignBattles` is called): add tier-reached filtering using the already-synced `campaign-events-progress` chunk.
- `apps/web/src/fsd/features/goal-farming/lib/estimate.ts` (`selectFarmNodes`): add the `expectedGold` tie-break.
- `apps/web/src/fsd/shared/lib/battle.domain.ts` (`FarmLocation`), `packages/game-catalog` dataset payload schemas: accept the new `expectedGold` field served by the companion API change.
- No UI changes are required by either fix on their own — both simply keep bad recommendations from being generated in the first place.
