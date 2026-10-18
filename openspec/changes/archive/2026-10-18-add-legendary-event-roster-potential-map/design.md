# Design

## Context

Clear estimates (`legendary-event-clear-estimates`) already give a team depth from effective power, and `laneReachablePoints` already scores the battles a set of teams reaches net of synced progress. Team suggestions already pick the strongest candidates per objective subset. The potential map reuses all three; it adds no new estimate.

## Goals / Non-Goals

- Goal: one glance per lane answers "how far can my roster go, and which objective holds it back".
- Goal: the map distinguishes what the user's saved teams already reach from what the roster could reach with better teams.
- Non-goal: modelling token counts. Potential is about reach, not how many tokens a full clear needs (the token plan does that).
- Non-goal: Goals Preview. The map reads the synced roster only in this change (see Open questions).

## Decisions

### D1. One "best team" per row, not a joint optimisation

Defeat-all potential depth = the estimated depth of the top five owned units the lane allows, by effective power. Objective `o` potential depth = the same over the owned allowed units that satisfy `o`, and 0 when fewer than three exist (the minimum team size). Each row is independent, matching how objectives are scored per battle by whichever token clears them. This is an upper bound the user can act on; it never claims one team clears everything.

### D2. Potential points reuse `laneReachablePoints`

Potential points left = `laneReachablePoints` fed with one synthetic team per row (its depth and its single covered objective). That keeps the formula, the progress netting and its worked examples identical to the token plan and the upgrade impact.

### D3. Four cell states, cleared wins

Cell state precedence: cleared (synced) > your teams reach (a saved team covering that row reaches the battle, by the same depth rule as reachable points) > roster can reach (potential depth > battle) > out of reach. Colours use existing tokens (`--event-legendary` for cleared, muted for out of reach) plus a hatched variant for "roster can", so the states do not rely on colour alone.

### D4. Map geometry

Desktop: three lanes side by side, 18 columns × 6 rows of small square cells per card. Mobile: one lane per tab, the same grid stretched to the card width (18 columns fit 320px at ≥ 14px per cell). No horizontal scroll on either form. Rows carry the objective icon at the start; columns carry battle numbers every third battle.

## Risks / Trade-offs

- Top-five-by-power ignores synergy; the clear estimates already accept that assumption.
- The map is only as good as `powerRatio`, still uncalibrated; the summary keeps the estimates' "estimate" wording.

## Open questions

- Should a Goals Preview toggle overlay "with your goals" reach? Default here: no, keep it to the synced roster; the 1-click plan wizard shows the projected roster instead.
