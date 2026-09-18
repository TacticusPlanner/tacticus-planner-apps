## Context

See proposal.md - Why. `daily-raids-energy.ts` builds a standing-only `{campaignGroupId}:{battleIndex}` index (`buildStandingBattleIndex`) by treating `nodeNumber - 1` as the battle index and excluding every battle whose `campaignGroupId` is an event campaign, because event campaigns interleave challenge nodes that share their preceding node's `nodeNumber` — so `nodeNumber - 1` can't disambiguate a regular node from its challenge variant, and the client had no served `battleIndex` to key on instead. `calculateRealEnergyUsedToday`, `buildAttemptsLeftByBattle`, and `buildTodaysAttempts` all consume that index and independently re-apply the same event-campaign exclusion to the raw `battleAttempts` list before looking anything up.

The companion `tacticus-planner-api` change (same change name, applies first) closes both gaps this relies on:

- `live-progress.battleAttempts[]` items gain `type`, so a Standard-tier and an Extremis-tier attempt at the same `battleIndex` are distinguishable.
- The served campaign-battle dataset gains `battleIndex` (the same value Tacticus's own campaign-progress payloads use, already computed server-side but never served), so the client can key by the real `battleIndex` instead of inferring it from `nodeNumber`.

## Goals / Non-Goals

**Goals:**

- Build one battle index covering every campaign (standing and event), keyed by `{campaignGroupId, type, battleIndex}`, replacing the standing-only index and its `nodeNumber - 1` inference.
- Feed that index into the same four consumers that already exist (`calculateRealEnergyUsedToday`, `buildAttemptsLeftByBattle`, `buildTodaysAttempts`, and the node-exhaustion check in the schedule itself) without changing their output shape or call sites' expectations beyond now including event-campaign entries.

**Non-Goals:**

- Changing `availableCampaignBattles`/`isEventNodeReached` (`campaign-event-eligibility.ts`) — that already correctly gates which event-campaign battles are _farmable_ via `campaign-events-progress`, and is unrelated to this change, which is about which battles the player has _actually raided today_, per real synced attempts.
- Changing "Only the active campaign event is farmable"'s stated assumption that `campaign-events-progress` and `live-progress.battleAttempts` are independent signals — that requirement's own behavior doesn't change; its assumption note about why the latter wasn't usable is now partly superseded, but revising that prose isn't a spec-level behavior change and is left alone here to keep this change's diff scoped to what's actually behaviorally different.
- The Home page's Daily Raids widget (`home-raids-widget`) — it explicitly never renders Bonus Raids or Today's Attempts, so it has no event-campaign exclusion to remove.
- Raids Plan (`daily-raids-plan`) — it has no "Today's Attempts"/real-energy-usage equivalent; unaffected.

## Decisions

**One `{campaignGroupId, type, battleIndex}` index for every campaign, not a standing index plus a separate event index.** `buildStandingBattleIndex` already has the right shape (a `Map` from a composite key to `BattleId`); extending its key to include `type` and switching its value source from `nodeNumber - 1` to the now-served `battleIndex` covers every campaign uniformly. A standing campaign's `type` is already on `Battle` (`battle.domain.ts`), so this costs nothing for that case — mirrors the API design's identical "uniform over special-cased" call for serving `battleIndex` on every battle.

**Key by the served `battleIndex`, not by re-deriving node order client-side.** The alternative — have the client independently walk each `{campaignGroupId, type}` track's battles in some order and assign its own running index — was rejected: it would duplicate the exact ordering rule the game catalog already establishes server-side (`GameCatalogLoader.cs`'s per-type running counter) and risk silently drifting from it if that rule ever changes. The served `battleIndex` is the single source of truth; the client only builds a `Map` from it.

**`RealBattleAttempt.type` and the served `Battle.battleIndex` are both required, non-optional fields once the companion API change ships.** Both chunks (`live-progress`, campaign-battles) are always re-synced/re-fetched in full rather than incrementally patched (per `player-data-sync`'s general chunk-replacement behavior and the campaign-battles dataset's manifest-hash-driven refresh), so there's no steady-state case where an old record without these fields sits alongside new ones — only a deploy-ordering window, handled by the cross-repo apply-order convention (API first), not by making the fields optional.

**Retire `eventCampaignIds`-based exclusion in `daily-raids-energy.ts`'s four functions; keep it everywhere else.** `eventCampaignIds` still gates farm-location eligibility (`use-daily-raids.ts`'s `availableCampaignBattles` call) — that's a different, unrelated concern (Non-Goals above) and keeps its own exclusion logic unchanged. Only the real-attempts bookkeeping in `daily-raids-energy.ts` drops its use of `eventCampaignIds` as an exclusion filter, since the new unified index makes the distinction unnecessary there.

## Risks / Trade-offs

[A served `Battle` for an event-campaign challenge node with a `battleIndex` that collides with another battle in the same `{campaignGroupId, type}` track, if the API-side ordering rule has an undiscovered edge case] → Mitigated by the companion API change's own denormalization test (verifying a challenge node's `battleIndex` is distinct from its same-`nodeNumber` regular node's, across all six event campaigns' both tracks); this change's own regression tests additionally assert the client-side index has no key collisions when built from a realistic event-campaign battle set.

[Removing the "event-campaign node treated as not exhausted" fallback could newly exclude a node that legitimately still has attempts remaining, if the new index fails to find an entry for it] → Bounded by the requirement text itself: a node whose real attempts-left data is unavailable is still treated as not exhausted (the fallback isn't removed outright, only its event-specific example is — see the `daily-raids-today` spec delta), so a lookup miss still fails open, not closed.

## Migration Plan

No data migration. Ships as a normal frontend deploy once the companion API change's `type` and `battleIndex` fields are live; per this repo's cross-repo convention, this apps half applies after the API half.
