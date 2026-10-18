## Context

`horde-tier-list.ts` resolves tiers from whatever the catalog serves, in catalog order, so a fifth tier renders without logic changes. `tierToneClass` (owned by `entities/legendary-event`, used by `tier-row.tsx` and `team-picker-tile-markers.tsx`) maps S, A, B, C to `chart-4`, `chart-2`, `chart-1`, `chart-3` and anything else to the neutral untiered tone.

## Goals / Non-Goals

**Goals:** D looks like a real tier; spec and fixtures match the revised data.

**Non-Goals:** strategy text, relic-conditional multipliers, any change to how multipliers enter clear estimates.

## Decisions

- **D uses `border-chart-5 bg-chart-5/20`.** `chart-5` is the one chart token not yet used, so D stays distinct from S to C and from the neutral untiered tone in both themes.
- **No desktop/mobile split.** Both layouts already render one band or section per catalog tier.
- **Fixture follows the real data.** The shared fixture mirrors the revised `horde-mode-tiers.json` so the spec's worked examples are the tested ones.

## Risks / Trade-offs

- Clear estimates shown to users shift for re-rated characters. That is the intent of the revision.
