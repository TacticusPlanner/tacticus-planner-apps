## Why

`/library/npcs` is routed and redirects to a first entity, but renders only the "detail unavailable" placeholder; the V1 `learn/npcs` page (faction → NPC → level, with stats, attacks, and traits) has no V2 equivalent (#43). The served NPC data is 534 variation records for 230 distinct units — Makhotep alone has five ladders (`necroNpcWarden`, `necroBossWarden`, `…LHE`, `…LEG`, `necroBossC1Warden`) that differ in which levels exist and, for 31 units, in the values at the same level — so a faithful page has to group variations under one NPC without merging their stats.

## What Changes

- **New NPC Library page** at `/library/npcs/{npcId}?variation={variationId}&level={n}`, replacing the placeholder: a global, filterable list of NPC _groups_ (one per distinct unit, deduplicated by catalog name) and a detail view whose Variation and Level selectors are secondary state.
- **NPC entity slice** (`entities/npc`) owning the grouping rule (name → group; slug as the route id), the default-variation rule, ladder ordering, the "all-zero ladder is unavailable" rule, and NPC portrait resolution from a ported id → file map (the served dataset carries no icon).
- **Scope**: only records with `kind: "unit"` are listed; Machines of War and loot objects are excluded via the new server-side `kind` field. Variations whose ladder is all zeros are hidden; a group with no remaining variation is not listed.
- **Filters** (global): text search on the localized name, faction, damage type (melee, ranged, or ability), trait — multi-select for damage type and trait. A group is listed when any variation matches; the detail Variation selector is narrowed to the matching variations.
- **Detail**: portrait, name, faction, variation, level; Health / Armour / Damage / Movement stat cards; one row per melee and ranged attack (damage-type icon, hits, range); trait icons with tooltips; explicit unavailable state instead of zero-valued stats.
- **Level selector** ordered by rank then stars (stable on ties) using the existing rank/star icons; ties on rank+stars (Survival wave scaling) are disambiguated by showing health.
- **Desktop / mobile** follow the Raid Bosses split: desktop list beside detail; mobile searchable combobox above the detail.
- **i18n**: new id-keyed `npcs` namespace (variation id → localized name, ported from V1 `npc_names.json` for en/de/es/fr) and `library` keys for the page; page tour (`npcs.tutorial.tsx`) for desktop and mobile.
- **Tighten** `packages/game-catalog` `npcSchema` to require `factionId`, `alliance`, `kind`.
- Companion change: `add-npc-library-page` in `tacticus-planner-api` (adds `factionId`, `alliance`, `kind` to the served `npcs` records). The API half applies first.

## Capabilities

### New Capabilities

- `npc-library`: the NPC Library page — group/variation/level model, scope and filtering rules, URL state, detail content, unavailable states, desktop and mobile layouts, and the page tour.

### Modified Capabilities

- `library-detail-placeholder`: the placeholder requirement no longer covers NPCs; only Machines of War keeps the placeholder.

## Impact

- `apps/web/src/fsd/pages/library/route.tsx` — `npcs` / `npcs/:entityId` route to the new page; `library-collection-page.tsx` narrows to `machines-of-war`.
- New `apps/web/src/fsd/pages/library/ui/npcs/**` (orchestrator, desktop, mobile, list/combobox, detail, level select, view-model, tutorial, tests).
- New `apps/web/src/fsd/entities/npc/**` (grouping, ordering, availability, portrait, labels hook).
- `packages/game-catalog`: `schemas/npc.ts` tightened; new `game-entities/npc-portrait-overrides.ts` + `icons/npc.ts`.
- `apps/web/public/locales/{en,de,es,fr}/npcs.json` (new namespace) and `library.json` additions; i18n resource types and namespace tests; two portrait assets (`adept_warsuit`, `darka_watcher`) copied from V1.
- `app-navigation` is unaffected: the Library → NPCs entry already exists.
- Consumers of `getNpcs()` (raid-boss library field-NPC resolution) are unaffected by the additive schema fields.
