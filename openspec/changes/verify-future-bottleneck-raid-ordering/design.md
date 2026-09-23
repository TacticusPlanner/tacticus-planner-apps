## Context

`daily-raids-today` already specifies longest estimated completion time, then energy, _within_ each goal, while configured goal priority wins _between_ goals. `raid-schedule.tsx` implements that display order. The scheduler's allocation/stage rules and `PLAN-013` strategy persistence need a trace before interpreting the tester's comparison.

## Goals / Non-Goals

**Goals:** Produce a reproducible fixture and a documented expected-versus-actual trace for each strategy.

**Non-Goals:** Hard-code rarity priority, change goal priority, or ship algorithm changes before a verified spec delta.

## Decisions

- Separate display order from actual raid allocation. Capture both for one immediate-common and one future-rare need on the same goal, then again across differently prioritized goals; vary daily energy, current inventory, available nodes, and strategy.
- Verify `PLAN-013` round-trip first so a strategy shown in the UI is the one the engine consumes. Account for `PLAN-014`'s blocker semantics before concluding a missing future raid is a ranking error.
- If current behavior satisfies the intended strategy, close with evidence and no code. If not, update this change to specify the exact strategy-dependent rule and deterministic tests; remove `skip_specs` then. V1 behavior is comparative evidence, not authority for V2 semantics.

## Risks / Trade-offs

- A UI display order can look myopic while the schedule pre-farms correctly → compare allocations, not screenshots alone.
- A rare resource may be unavailable/blocked → distinguish source eligibility from ordering.

## Open Questions

- Under which strategy and planning horizon, if any, does the future bottleneck actually lose an appropriate raid? The fixture resolves this before a scheduling requirement can be written.
