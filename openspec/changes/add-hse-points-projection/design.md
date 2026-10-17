# Design

## Context

- Contract: `event-definitions[].config.hse` from the companion API change (variants, tiers with cumulative milestones and a repeat step, trackers, modifiers; game modes in catalog names). Variant rule: `parameters.hseVariant`, else `parameters.targetFactionId`, else `default`.
- Player data: `gameModeTokens.{arena,onslaught,salvageRun}` buckets (`current`, `max`, `nextTokenInSeconds`, `regenDelayInSeconds`, nullable per mode), `powerLevel`, roster progression. The app requires an API key and synced data, so a synced player is always present; a null bucket means the mode is not unlocked.
- `plTier(powerLevel, hasBlueStarUnit)` and `PL_MEDIUM` already exist in `@workspace/game-catalog`.
- `features/legendary-event-tokens/lib/token-supply.ts` already projects a synced bucket to an end time from its observed-at instant.
- `features/shop-rewards` maps reward ids to icons and labels (`shopRewardDisplay`) and already exposes an `@x` entry for `daily-raids`.
- The instance switcher (`add-hse-instance-switcher`) gives the page one selected instance with a status (running, upcoming, past). This change builds on it.

## Decisions

### D1. New feature slice `home-screen-event-points`

Details and projection are one feature with one public API (`index.ts`): `useHseProjection(instance)`, `EventDetails`, `PointsProjection`. `daily-raids` keeps the raid lists; neither imports the other; `hse-page.tsx` composes both. Reward display comes through a new `shop-rewards/@x/home-screen-event-points.ts`.

### D2. One canonical result, summaries derived

`projectHsePoints(input): HseProjection` returns:

```
{
  target: number                 // final cumulative milestone
  repeatStep: number | null
  pointsSoFar: number
  remaining: number              // max(0, target - pointsSoFar)
  modes: { mode, tokens, unit, pointsPerUnit, average, points }[]   // only unlocked, scoring modes
  unitsToFinal: number | null    // when every mode shares unit and pointsPerUnit
  requiredPerToken: { value, unit: "kills" | "waves" | "points" }
  projected: { points, milestonesReached, milestoneCount, pointsToNext, repeats }
}
```

The UI reads only this. The status line and tour never recompute.

### D3. Tokens per mode

Mirrors `token-supply.ts`. For a running event, with `observedAt` the sync instant of the buckets and `end` the event end: `next = observedAt + nextTokenInSeconds`, `tokens = current + (next < end ? 1 : 0) + floor((end - next) / regen)` (assumes the player spends before the bucket caps, as for LRE). For an upcoming event: `tokens = max + floor(duration / regen)` (assumes a full bucket at the start). Past: not projected. The function is extracted to a shared helper only if the LRE code can call it unchanged; otherwise it is a sibling in this slice.

### D4. Points per unit when several trackers apply

Per mode, the trackers whose `gameModes` pass the mode are summed (Faction Boost in Arena: 2 + 1 = 3 points per kill when the kill matches both). The UI names the assumption. Unit by tracker kind: `KillUnits` kills, `DefeatWaves` waves, `DeployedUnitsOfFactionMajority` and `FullLineUpOfFaction` battles (one per token, so their average is fixed at 1 and the points per unit is the sum). Guild and expedition trackers do not score in a token mode and get no projection.

### D5. Defaults and persistence

Average per token defaults: kills Arena 5, Onslaught 20, Salvage Run 12 (Severyn's estimates); waves and battles start empty (waves) or fixed at 1 (battles). Averages persist per browser by `(definitionId, mode)` in `localStorage`; "points so far" persists by instance key. Both reads and writes are guarded like `team-recommendation-prefs.ts`.

### D6. Description lines from data, translated on the client

The server sends no text. Each line is an i18n template chosen by modifier or tracker kind and filled from served values: XP (`{{multiplier}}x XP` for `{{units}}` in `{{modes}}`), stat boost (`+{{health}}% Health, ...` in `{{modes}}`), and one line per tracker (`{{points}} point(s) for each {{enemy}} you defeat with {{player}} in {{modes}}`). Unit filters render via existing trait, faction and alliance labels; summons and steppables appear as "excluding Summons". A tracker with an unknown kind renders no line.

### D7. Layout

Order on the page: status line, event details (tier, description, milestone grid), points projection, then the raid farm list and top-10 lists when the event has a raid rule. Desktop: details and projection side by side above the raid lists; milestone grid 5 columns. Mobile: stacked; milestone grid 3 columns; the description is collapsed to its first line with "Show more". Tour targets `hse-event-details`, `hse-milestones`, `hse-projection` on both forms.

## Risks

- Kill averages are rough (Severyn's estimates). They are editable and persisted, and the required rate does not depend on them.
- `nextTokenInSeconds` is relative to the sync; a stale sync overstates current tokens. The projection shows the sync time.
