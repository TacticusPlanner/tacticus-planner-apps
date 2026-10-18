# Proposal

## Why

A lane tab's Lane overview shows a "Points per battle" bar ladder that only restates catalog data. Severyn wants to see at a glance how far the roster can get on each lane from the clear estimates, and where it falls behind, without building teams first.

## What Changes

- **Roster potential per lane.** For each lane the planner computes, from the synced roster and the Stage 5 clear estimates, how deep the roster can go for defeat-all and for each of the lane's five objectives: the estimated depth of the strongest team (top five owned, allowed units by effective power) that fits that objective. It turns that into the lane's **potential points left** with the same formula as lane reachable points.
- **Potential mini map replaces the points ladder.** In each lane's Lane overview card the "Points per battle" bar row becomes a compact map: one column per battle, one row for defeat-all and one per objective. Each cell shows one of four states: **cleared** (synced), **your teams reach it**, **your roster can reach it** (no team does yet), **out of reach**. A summary line above it reads "Roster reaches battle 6 · 1,136 of 8,569 points left" and "Falls behind at battle 7 · no unit for Resilient, Max 2 Hits, Piercing".
- **Per-battle points stay available** as each column's accessible label and tooltip ("Battle 3 · 35 points · Ultramarines: roster can reach").
- **The Overview tab's lane summary** gains the same one-line "roster reaches battle N" figure per lane, so all three lanes are visible together.

No **BREAKING** changes: front end only, nothing stored changes shape.

## Capabilities

### New Capabilities

- `legendary-event-roster-potential`: per-lane roster potential depths, potential points left, the mini map cell states and the "falls behind" summary.

### Modified Capabilities

- `legendary-events-hub`: the Lane overview section replaces the per-battle points ladder with the roster potential mini map.

## Impact

- `apps/web/src/fsd/entities/legendary-event/lib`: `rosterPotential(lane, roster, estimates, progress)` beside `unit-potential.ts` and `laneReachablePoints`.
- `apps/web/src/fsd/pages/legendary-events/ui/legendary-event/lane-overview.tsx` (map replaces the ladder) and the Overview lane summary.
- Tour copy for the lane overview step; `legendaryEvents` i18n in en/de/es/fr.
- No API change; no companion `tacticus-planner-api` change.
