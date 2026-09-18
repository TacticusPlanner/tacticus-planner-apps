## Why

Today's "Today's Attempts" section and its real-daily-energy-usage indicator both deliberately exclude campaign-event (Standard/Extremis) raids: a player who raided the Adepta Sororitas event campaign today sees those raids nowhere on Today, while V1 correctly lists them. The `daily-raids-today` spec documents this as intentional, because `live-progress.battleAttempts` can't tell which tier (Standard vs Extremis) an event-campaign attempt belongs to — the same `{campaignId, battleIndex}` key can collide between the two tiers.

The companion `tacticus-planner-api` change (same change name) closes the actual gap: it adds `type` to each synced battle-attempt record and `battleIndex` to each served battle, so an event-campaign attempt is no longer ambiguous and can be resolved back to its exact battle (including a challenge node, which shares its preceding node's `nodeNumber` and so can't be resolved by `nodeNumber` alone). This change consumes both fields to stop excluding event-campaign raids from the real-attempts-based parts of Today.

## What Changes

- `live-progress.battleAttempts[]` items gain a required `type` field, and served campaign battles gain a required `battleIndex` field (both served by the companion API change) — the client schemas and `RealBattleAttempt`/`Battle` types accept them.
- `daily-raids-energy.ts`'s battle-attempt indexing (`buildStandingBattleIndex` and its consumers `calculateRealEnergyUsedToday`, `buildAttemptsLeftByBattle`, `buildTodaysAttempts`) is extended to index every campaign by `{campaignGroupId, type, battleIndex}` (the served `battleIndex`, not the inferred `nodeNumber - 1`), instead of unconditionally excluding any battle whose `campaignGroupId` is an event campaign.
- "Today's Attempts" lists event-campaign raids performed today, the same way it already lists standing-campaign raids.
- The real daily-energy-usage indicator includes event-campaign attempts' energy cost in its total, removing the documented undercount.
- A node's real attempts-left (used to exclude an exhausted location from its resource card) now applies to event-campaign nodes too, removing the "treated as not exhausted" fallback that only existed because event-node attempts-left data was previously unavailable.
- No UI layout changes — this only feeds already-existing sections with data they were previously denied.

## Capabilities

### Modified Capabilities

- `daily-raids-today`: "Today's Attempts section" and "Today shows real daily energy usage" drop their event-campaign exclusions; "Today's raid schedule" drops the "event-campaign node treated as not exhausted" fallback now that real attempts-left data is available for event nodes too.

## Impact

- `packages/player-data/src/player-data.schema.ts` (`liveProgressSchema`'s `battleAttempts` item): add required `type: z.string()`.
- The campaign-battle storage schema/type consumed via `@workspace/game-catalog` (wherever `CampaignBattleStorageModel`-equivalent battle records are parsed) and `apps/web/src/fsd/shared/lib/battle.domain.ts` (`Battle`): add required `battleIndex: number`.
- `apps/web/src/fsd/features/daily-raids/model/daily-raids-energy.ts` (`buildStandingBattleIndex`, `calculateRealEnergyUsedToday`, `buildAttemptsLeftByBattle`, `buildTodaysAttempts`): extend indexing to cover every campaign by `{campaignGroupId, type, battleIndex}`, keyed off the served `battleIndex`; the `RealBattleAttempt` type gains `type`.
- `apps/web/src/fsd/features/daily-raids/model/use-daily-raids.ts`: no signature change expected (`eventCampaignIds` may no longer be needed by these specific calls — see design.md), but review call sites that assumed event campaigns were always excluded here.
- Depends on the companion `tacticus-planner-api` change (same change name) serving `type` on `live-progress.battleAttempts[]` and `battleIndex` on served campaign battles — see that repo's proposal. Per this repo's cross-repo convention, the API half applies first.
