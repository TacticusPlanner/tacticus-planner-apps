## Context

See proposal.md — Why. V2's game-catalog package already has the machinery this
needs: `packages/game-catalog/src/game-entities/icons/asset-path.ts`
(`ASSET_BASE_PATH = "/game_catalog"`), `icons/character.ts`
(`characterIcon`, `roundPortraitIcon`), and the `character-icon-overrides` /
`mow-icon-overrides` `Map`s for ids whose slug does not match the asset name.
Assets live under `apps/web/public/game_catalog/characters/`. `RaidBossPortrait`
already renders through the shared `EntityIcon`, which falls back to a badge on
missing/failed `src`.

V1's portrait data is three hand-maintained maps in
`4-entities/guild_boss/guild-boss-portraits.ts` plus a fuzzy npc adapter
(`guild-boss-npc-adapter.ts`) that resolves a field npc via `questUnitId` first,
then a name-based fuzzy match. V2's prime name resolution already uses the
playable-character roster, so many primes will resolve a portrait through the
existing `characterIcon` path with no new map entry.

## Goals / Non-Goals

**Goals:**

- Real portraits for bosses, primes, and field npcs, using V2's existing icon
  infrastructure and asset root — not a parallel image loader.
- One resolution path per entity kind, with the initials badge as the only
  fallback.
- An explicit, checked-in list of ids with no asset (even in V1) so the badge
  for those reads as intentional.

**Non-Goals:**

- No new art. Only assets that exist in the V1 repo are copied over.
- No full (non-round) boss splash art in the detail header for this change —
  `bossPortraitMap` is ported so it is available, but wiring a hero image is
  optional and can follow.
- No API work beyond the companion change's `questUnitId` field.

## Decisions

- **Port the maps as game-catalog override data**, not into the raid-boss FSD
  slice: `packages/game-catalog/src/game-entities/raid-boss-portrait-overrides.ts`
  exporting `raidBossRoundPortraitOverrides`, `raidBossFullPortraitOverrides`,
  `fieldNpcPortraitOverrides` (verbatim from V1's `unitRoundIconMap`,
  `bossPortraitMap`, `npcUnitRoundIconMap`). Rationale: id→asset resolution is
  the game-catalog package's job everywhere else in V2; the page just calls a
  helper.
- **New `icons/raid-boss.ts`** with:
  - `raidBossPortrait(unitSetId)` → override map → else `characterIcon(id)` for
    a playable prime → else `undefined`.
  - `fieldNpcIcon({ id, questUnitId })` → `fieldNpcPortraitOverrides[id]` →
    `questUnitId` through the npc/character icon path → override by
    `questUnitId` → else `undefined`.
    Both return `/game_catalog/characters/…` strings via `ASSET_BASE_PATH`.
- **Asset copy:** the referenced `snowprint_assets/characters/*.png` files copy
  1:1 into `apps/web/public/game_catalog/characters/` keeping their filenames,
  so the override values are just the bare filename joined to the base path.
- **`questUnitId` threading:** the API companion adds it to the served payload;
  the game-catalog query mapper adds it to the raid-boss record type; the page
  passes `record.questUnitId` into `fieldNpcIcon`.
- **Desktop/mobile:** no split — the portrait helpers and `RaidBossPortrait`
  are identical on both; only the existing layout differs. No new tour step
  (portraits are decorative; the existing "choose an entity" step already
  points at the list items).

### V1-parity checklist

- **V1 asset/icon ids reused:** `unitRoundIconMap` (34 entries),
  `bossPortraitMap` (16), `npcUnitRoundIconMap` (9), `bossPrefixPortraitMap`
  (derived) — ported verbatim; the `snowprint_assets/characters/**` PNGs they
  reference are copied into `public/game_catalog/characters/`.
- **V1 navigation/layout pattern:** round portrait in the list item and beside
  the detail heading — kept. Full `bossPortraitMap` splash art in the detail
  header — **dropped for this change** (map ported, wiring deferred).
- **V1 secondary states:**
  - field-npc portrait via `questUnitId` then fuzzy name — **kept** (fuzzy name
    match already exists in V2 `unit-name.ts`; this adds the `questUnitId` and
    map steps ahead of it).
  - `GuildBoss{N}` prefix → first boss portrait fallback (`bossPrefixPortraitMap`)
    — **kept** as a last resort before the badge.
  - ids with no asset in V1 (e.g. some Necron/Tyranid minions) — **documented**
    in `raid-boss-portrait-overrides.ts` as a comment block; badge is expected.
  - broken/missing image → `EntityIcon` badge — **kept** (existing behavior).

## Risks / Trade-offs

- [Copying every referenced PNG bloats the repo / `public/`] → Scope is ~50
  small round-portrait PNGs; the `game_catalog/characters/` folder already holds
  the full character roster, so the marginal size is minor. Copy only
  referenced files, not the whole V1 `snowprint_assets` tree.
- [A V1 map entry points at a filename that was never committed to V1] → The
  port task verifies each referenced file exists in the V1 repo before copying;
  any missing one is added to the documented no-asset list, not left as a
  broken `src`.
- [Prime resolves a _character_ portrait that looks different from V1's
  guild-specific one] → Acceptable — it is still a correct portrait of that
  unit; V1-specific overrides win where present.
- [`questUnitId` field missing because the API companion has not deployed] →
  `fieldNpcIcon` treats it as optional and falls through to the map + fuzzy
  path; no crash, just the pre-change behavior for field npcs.

## Migration Plan

1. Land the API companion (`questUnitId` in the served payload) first.
2. Port maps + helpers + copy assets + wire `RaidBossPortrait` and the
   field/prime rows.
3. Verify in the browser against V1 for a sample of each faction.
   Rollback: revert the apps change; `RaidBossPortrait` returns to
   badge-always. The copied assets are inert if unreferenced.

## Open Questions

None affecting specs or tasks. Whether to also wire the full boss splash art in
the detail header is a follow-up, explicitly out of scope here.
