# Design

## Context

See proposal.md for the three feedback points. What the code does today:

- `teamPointsPerBattle` (`entities/legendary-event/lib/team-points.ts`) returns `lane.killPoints` + the covered objective scores. It never reads progress, so `buildTeamCardViewModel` shows 152 for a Flying · No Resilient team on Lysander Alpha even when No Resilient and defeat-all are cleared through battle 13.
- The canonical progress-aware figure already exists: `laneReachablePoints(model, progress, reaches)` (`reachable-points.ts`), used by upgrade impact, the token plan and suggestion gains. Per-unit, `remainingLanePoints` backs the leaderboard's default "remaining points".
- `suggestLaneTeams` computes gain over `laneReachablePoints`, so a gain is already net of progress. What goes wrong is the subset: {Flying, No Resilient} restricts candidates to units satisfying both, and its chips and reason line advertise No Resilient.
- `TeamEditorDialog` renders Name, Members (`TeamUnitPicker`), Covered objectives, Clear depth in that order. The footer `TeamEditorSummary` is sticky.
- `TeamUnitPicker` shows rarity and rank only under Goals Preview (`previewUnit`), and its tile points are static `pointsPerBattle` from `buildPickerTiles`.
- The Teams section already holds `progressByLane` and `estimates.byLane[laneId]` (with `.team` and `.unit` estimators); the editor host passes `estimateTeam`, roster and goals preview, but not progress.

## Goals / Non-Goals

**Goals:**

- One progress-aware rule for team points on cards, the editor and suggestions, derived from `laneReachablePoints` rather than a parallel calculation.
- Picker tiles reuse the leaderboard's unit figures (remaining points, rarity, rank, "~n" clears) and the same helpers.

**Non-Goals:**

- Deducting other teams' coverage from a card (that is the suggestion gain's job; a card stays standalone).
- Ability levels (V1's A/P figures) on tiles, a V1-style list view, or a numeric power figure per tile. Those are the alternatives offered to the user for feedback 3.
- Any API or stored-shape change.

## Decisions

### D1. Card points = single-team reachable points over its displayed depth

`teamPointsLeft(model, progress, { depth, coveredObjectiveIndexes })` = `laneReachablePoints(model, progress, [reach]).total`, with the derived, stored objectives as coverage and `displayedDepth` as depth. It lives in `entities/legendary-event/lib/team-points.ts`, next to `teamPointsPerBattle`, which stays for the picker fallback and tests until no consumer is left, then it is removed.

_Alternative:_ keep "per battle" but average the remaining points over the depth (880 / 11 = 80). Rejected: an average hides that some battles still pay much more than others, and the run forecast and token plan already speak in totals.

_Alternative:_ deduct points the lane's other teams already reach. Rejected for the card: two cards would then each depend on the other's order, and the user reads a card as "what this team earns". The suggestion dialog keeps the "over your teams" gain.

### D2. "Cleared through depth" is one entity helper

`objectiveClearedThrough(progress, objectiveIndex, depth)` in `synced-lane-progress.ts`: true when `depth ≥ 1` and every battle `0..depth-1` has column `objectiveIndex + 1` cleared. Cards, the editor and suggestions all call it. A loading or failed progress read is `undefined`, so nothing is cleared (current convention).

### D3. Suggestions filter on the subset after the depth is known

In `suggestLaneTeams`, after computing a proposal's depth, drop it when any `subset` objective is cleared through that depth. The proposal's members are then the strongest units for a subset that still pays. Filtering subsets before choosing members was rejected because the depth depends on the members.

### D4. Progress reaches the editor through the existing host

`team-editor-host.tsx` passes `progress` (the lane's `LaneProgressView | undefined`) and the lane's unit estimator into `TeamEditorDialog`, which hands them to `TeamUnitPicker`. `buildPickerTiles` takes `progress` and returns `remainingPoints` (via `remainingLanePoints`) instead of `pointsPerBattle`, plus `effectivePower` for the Power sort. No feature-to-feature import: everything comes from `@/entities/legendary-event`.

### D5. Tile strength row is the existing preview row, always on

The rarity / rank / clears row already exists for Goals Preview. It renders for any unit the shown roster holds; `clearsOf` moves from the preview-only `PickerGoalsPreview` to a plain `unitClears?: (unitId) => number | null` prop that reads the preview roster's estimator while preview is on and the synced one otherwise. The preview marker stays preview-only.

### D6. Sort control is a two-option segmented toggle

Placed in the picker's controls row beside Only unlocked and Goals Preview. Local state in `TeamUnitPicker`, like the objective-chip selection, so it resets on close and survives Save and add another. Power uses `unitEffectivePower` on the shown roster.

### D7. Editor order change, same on both forms

Move the Covered objectives and Clear depth `<section>`s above the Members section in `TeamEditorDialog`. Desktop and mobile share markup, so there is no layout split. The page tutorial targets `data-testid`s, which do not change; a tour step that points at the coverage section gets re-checked for order.

## Risks / Trade-offs

- [Card numbers drop sharply for players deep into an event (152 → 880 total, or 0)] → The figure is labelled "points left · battles 1–D", and a 0 is honest: the team earns nothing new there.
- [Tiles get taller on the mobile four-column grid] → One compact line with 16px icons. Verify at 375px that the name and points do not truncate further.
- [Remaining points on tiles ignore depth (a unit's whole-lane figure)] → Matches the leaderboard. The "~n" clears next to it shows how far the unit is likely to get.
- [Synced progress is stale until the next sync] → Same as every other progress-aware figure on the page.

## Migration Plan

Front-end only. Ship behind no flag; rollback is a revert.

## Resolved

- Feedback 3: the user chose strength + sort (D5, D6). Ability levels and a V1-style list view stay out of scope.
