## Context

`horde-tier-list.ts` resolves tiers from whatever the catalog serves, in catalog order, so a fifth tier renders without logic changes. `tierToneClass` (owned by `entities/legendary-event`, used by `tier-row.tsx` and `team-picker-tile-markers.tsx`) maps S, A, B, C to `chart-4`, `chart-2`, `chart-1`, `chart-3` and anything else to the neutral untiered tone.

## Goals / Non-Goals

**Goals:** D looks like a real tier; spec and fixtures match the revised data.

**Non-Goals:** strategy text, relic-conditional multipliers, any change to how multipliers enter clear estimates.

## Decisions

- **D uses a dashed, muted outline (`border-dashed border-muted-foreground/60 bg-muted`).** `chart-5` was the one unused chart token, but it shares B's (`chart-1`) hue in light mode and is a pale, low-chroma blue in dark mode, so D would blur into B or Untiered. A dashed border reads as "evaluated, low" without the destructive tone and stays distinct from the solid untiered border.
- **No desktop/mobile split.** Both layouts already render one band or section per catalog tier.
- **Fixture follows the real data.** The shared fixture mirrors the revised `horde-mode-tiers.json` so the spec's worked examples are the tested ones.

## Risks / Trade-offs

- Clear estimates shown to users shift for re-rated characters. That is the intent of the revision.
