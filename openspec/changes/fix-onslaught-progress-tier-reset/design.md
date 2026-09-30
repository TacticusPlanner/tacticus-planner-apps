## Context

`updateAlliance` merges a partial `{ sector }` or `{ tier }` patch into the draft. Sector order is `onslaughtSectors` (Stone → Adamantine) from `@/entities/player-data-override`; tiers are 1–4 with 4 meaning the sector is complete.

## Decisions

- Add a pure helper in the page slice, `tierAfterSectorChange(from, to, tier)`: `to` later in `onslaughtSectors` than `from` → 1; earlier → 4; equal → `tier`. The sector `onValueChange` passes `{ sector, tier: tierAfterSectorChange(...) }` to `updateAlliance`; the tier `onValueChange` is untouched.
- No new UI. The tier select shows the reset value immediately because it renders from the draft.
- One unit test for the helper (up, down, same) plus one page test asserting the tier select shows 1 after Gold → Diamond.

## Risks / Trade-offs

- A user who deliberately set a tier before changing sector loses that tier and must re-pick it. This is the agreed rule on the UserJot post.
