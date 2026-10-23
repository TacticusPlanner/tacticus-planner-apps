# Proposal

## Why

Players want to know before they spend tokens whether a quest battle is winnable with their roster, and what the whole quest will be worth: points, crates and featured-hero shards. Legendary Events already answer this with clear estimates. Quests need a variant, because each battle has its own team rules and objectives: playing for the objectives can bench a player's strongest units, so the clear that keeps the objectives and the clear that drops them can differ. Severyn asked for both estimates, with the second shown only when the first can't clear or barely clears.

## What Changes

- **Battle power** from NPCs: the sum over a battle's enemies (pickups excluded) of `npcPower` at the enemy's ladder row, times its count.
- **Estimate with objectives** (always shown): the `add-quest-event-teams` team versus battle power through a power ratio, with clear or not, the margin, and the points if cleared.
- **Estimate without objectives** (only when the first fails or is marginal, under 15% above): the strongest team under the hard rules only, with the points it would earn and the objectives it gives up ("400 instead of 500, needs Ahriman, excluded by No Psyker").
- **Neither clears**: the shortfall in percent, and the members below the tier cap with the power they would gain at the cap.
- **Projection**: per battle, the tracked score when entered, else the estimate's points; the projected total, crates and shards (with the bundle) in the summary and the rewards card. Labelled "uncalibrated" while the ratio is the default 1.0.
- A pure calibration function for samples, as LE has, to set the ratio once data exists.

## Capabilities

### New Capabilities

- `quest-event-clear-estimates`: battle power, the two estimates and when the second shows, the points of each, the shortfall help, the projection, calibration and data states.

### Modified Capabilities

None. The projection lines are added to the summary and rewards card through this capability's own requirements.

## Impact

- Apps only; no companion API change. It reads `quest-events`, `npcs`, `unit-power` and the roster, all served or synced.
- Depends on `add-quest-event-tracker`, `add-quest-event-rewards` (projected shards and crates) and `add-quest-event-teams` (capped power, eligibility and the selector).
- `features/quest-event/model` (battle power, estimates, projection, calibration in `.ts`), the estimate block in the battle detail and the battle row verdict, the projected lines in the summary and rewards card, `quest` locales in four languages.
