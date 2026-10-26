# Design

## Context

- LE clear estimates (`legendary-event-clear-estimates`) compare a team's effective power with the catalog battle power through a ratio of 1.0 until calibrated, and show the margin and the shortfall.
- Quest battles carry the game's power only where recorded (Nubari). Elsewhere it is computed from NPCs with `game-domain` `npcPower`, which the NPC Library already uses.
- `add-quest-event-teams` provides capped power, eligibility, the selector and objective badges. `add-quest-event-rewards` provides the rewards functions that take a score.

## Goals / Non-Goals

**Goals:** a per-battle verdict and one projected total that never contradicts the tracker.

**Non-Goals:** modelling synergy, board or AI; an in-app calibration flow; goal suggestions beyond the cap gap.

## Decisions

### D1. Battles are scored one by one

Unlike LE, a quest has no lane depth: each battle has its own team. The summary is the projection, not "N of 17".

### D2. The second estimate is lazy and conditional

It is computed only when the first fails or is marginal, and shown only when the team differs. That follows Severyn's rule and keeps the page from pushing players to drop points they can get.

### D3. The 15% threshold is one constant

`MARGINAL_MARGIN = 0.15`, to be tuned with calibration. Execution objectives are not given extra margin; the marginal flag covers them.

### D4. The projection feeds the existing functions

`projectQuest(score, estimates)` returns a projected score in the same shape as `scoreQuest`, which `questRewards` reads unchanged. Entered scores always win over estimates.

### D5. Calibration minimizes contradictions

Clears only bound r from above, and failures from below. Counting contradictions handles both and is robust to a few wrong entries. The result is a constant shipped in the app, like LE.

## Risks / Trade-offs

- [NPC power is a poor proxy] → labelled uncalibrated; the ratio absorbs a constant bias once samples exist.
- [Players read the projection as a promise] → "estimate" labels and entered scores override it.
- [Cost of two teams per battle] → 17 battles and two cheap selections; memoised per roster and dataset hash.
