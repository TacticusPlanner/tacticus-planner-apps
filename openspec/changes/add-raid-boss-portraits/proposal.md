## Why

The Raid Bosses library renders an initials badge for every boss, prime, and
field npc — `RaidBossPortrait` only ever gets a `src` when one happens to
resolve, and no raid-boss portrait assets are bundled in V2. V1's guild-boss
pages show real round portraits from hand-maintained id→asset maps. The
`raid-boss-catalog` spec already anticipates real portraits ("Known unit-set id
renders its portrait"), so this closes an implementation gap, not a new
capability.

This is the third of the three `#122` follow-ups, and the only one with an API
half. The companion change is `add-raid-boss-portraits` in `tacticus-planner-api`
(adds `questUnitId` to the served `raid-bosses` projection so a field npc can be
mapped to its canonical portrait). The API half applies first.

## What Changes

- Port V1's portrait maps from
  `tacticusplanner/src/fsd/4-entities/guild_boss/guild-boss-portraits.ts` —
  `unitRoundIconMap` (boss / prime / minion round portraits),
  `bossPortraitMap` (full boss portraits), `npcUnitRoundIconMap` (field-npc
  round portraits), and the `GuildBoss{N}`-prefix fallback — into the
  game-catalog package as override maps beside the existing
  `character-icon-overrides` / `mow-icon-overrides`.
- Add `raidBossPortrait(unitSetId)` and `fieldNpcIcon(id)` helpers in
  `packages/game-catalog/src/game-entities/icons/`, resolving to
  `/game_catalog/characters/…` paths. Resolution order for a field npc:
  the unit set's `questUnitId` → `npcUnitRoundIconMap` → the existing npc/
  character icon path → none.
- Copy every `snowprint_assets/characters/**` file referenced by those maps
  into `apps/web/public/game_catalog/characters/`.
- Wire the helpers into `RaidBossPortrait` (list + detail) and the field-enemy
  / prime-modifier rows so real portraits render, with the initials badge kept
  strictly as the missing-asset fallback.
- Consume the new `questUnitId` field through the game-catalog query surface
  (from the API companion change).
- Document every id that has no portrait asset even in V1 (so the badge
  fallback for those is intentional, not a regression).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `raid-boss-catalog`: the "resolve to icons with a graceful fallback"
  requirement is tightened from "where iconography exists" to the ported map
  set plus the field-npc resolution order; the query-surface requirement gains
  `questUnitId` on each per-unit record.
- `raid-boss-library`: the list requirement states real portraits are shown,
  with the badge as the missing-asset fallback.

## Impact

- `packages/game-catalog/src/game-entities/` — new `raid-boss-portrait-overrides.ts`
  (ported maps) + `icons/raid-boss.ts` (`raidBossPortrait`, `fieldNpcIcon`),
  barrel export, tests.
- `packages/game-catalog` query surface — `questUnitId` added to the raid-boss
  record type and mapper (fed by the API companion change).
- `apps/web/public/game_catalog/characters/` — new portrait PNGs.
- `apps/web/src/fsd/entities/raid-boss/ui/raid-boss-portrait.tsx` and the
  `raid-bosses` page/detail — call the helpers; drop the "assets not yet
  bundled" comment.
- `apps/web/src/fsd/pages/library/ui/raid-bosses/raid-boss-detail.tsx` — field
  enemies and prime rows render an icon.
- Depends on `tacticus-planner-api` `add-raid-boss-portraits` (applies first).
