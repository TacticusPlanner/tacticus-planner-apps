## Context

`clearEstimateConfig` builds `hordeMultipliers: Map<unitId, number>` from the catalog list, and `unitHordeMultiplier(config, unitId)` reads it; it does not see the roster. `unitEffectivePower` already has the roster (`LegendaryEventRosterUnit.equippedItems`, each with `equipmentId`).

## Goals / Non-Goals

**Goals:** relic multiplier applied wherever the horde multiplier is; relic info visible on the Tier List.

**Non-Goals:** relic level scaling, relic advice text (`add-horde-mode-strategy-notes`), showing roster-dependent multipliers as a tile's main figure.

## Decisions

- **One lookup, roster as an input.** `ClearEstimateConfig` gains `hordeRelicMultipliers?: Map<unitId, ReadonlyMap<equipmentId, number>>` (optional, so hand-built configs keep compiling). `unitHordeMultiplier(config, unitId, rosterUnit?)` returns the highest relic multiplier whose `equipmentId` is equipped, else the base. Every power figure goes through `unitEffectivePower`, which already holds the roster and passes the unit, so no other caller changes; goals preview spreads the synced unit, so its `equippedItems` carry over.
- **Tier List ranks by base.** Tiles sort and display by base multiplier so everyone sees the same list; the relic multiplier and its equipped state live in the details.
- **Relic names from `equipmentItems`.** The details resolve the relic's display name by `equipmentId` through the existing equipment-item namespace; no display strings come from the API.
- **No desktop/mobile split.** The relic rows sit in the same details content, shown in the popover on desktop and the bottom sheet on mobile.

## Risks / Trade-offs

- Clear estimates now differ between players with and without the relic. That is the point; the details make the reason visible.
