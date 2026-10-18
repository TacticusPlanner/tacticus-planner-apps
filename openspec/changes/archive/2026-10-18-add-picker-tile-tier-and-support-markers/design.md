# Design

## Context

- The picker tile (`team-unit-picker.tsx`) is a card with the reserve toggle absolutely positioned at `top-0.5 right-0.5`.
- Tiers come from the catalog `horde-mode-tiers` record. `clearEstimateConfig` reads it into `hordeMultipliers`, and the picker already receives that config through `estimates.config`.
- The Tier List colours each tier through `TIER_TONES` in `tier-row.tsx` (S, A, B and C; anything else uses the neutral tone).
- The leaderboard already marks Healer and Mechanic with `traitIcon(trait)` and a translated sr-only label.

## Decisions

### D1. Tier data rides on the clear-estimate config

`ClearEstimateConfig` gains `hordeTiers: ReadonlyMap<string, string>` (unitId → tier name). It is built with the same lookup as the multipliers, so the tile shows the tier the estimate uses. A character whose tier is missing from the record has no badge. While the config is loading or failed, no badge shows.

_Alternative:_ read the tier list again in the picker. Rejected: it would be a second read of the same record, and it could disagree with the estimate.

### D2. Shared tier tones

`TIER_TONES` and the untiered tone move to `entities/legendary-event` as `tierToneClass(tier)`. The Tier List and the badge both use it.

### D3. Marker column

There is a `flex flex-col items-center gap-0.5` column at `absolute top-0.5 left-0.5`, the mirror of the reserve button. It holds:

1. The tier badge: a `size-5` rounded square with the tier letter in bold `text-[10px]` and the tier tone's border and background. Its `title` and sr-only text are "Tier S".
2. Below the badge, one `size-4` trait icon per support trait the character has, Healer before Mechanic. Each has the translated trait name as its title and sr-only text.

The column is outside the toggle button, so it does not change the button's accessible name. It is `pointer-events-none`, so a tap on it still reaches the tile.

## Risks / Trade-offs

- [The column can overlap the portrait on narrow tiles] → The portrait is centred and `size-10`. At three columns on a 360px screen, a tile is about 110px wide, which leaves about 30px on each side for the 20px column.
