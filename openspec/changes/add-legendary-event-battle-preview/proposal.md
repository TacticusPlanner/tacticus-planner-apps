# Proposal

## Why

V1's Legendary Event page has a **Battles** tab (`plan-lre/le-battles.tsx`, `le-battle.tsx`) where players pick a track and a battle and see its map, its waves round by round and every enemy with its level, opening an NPC stat card on tap. Players use it to check what a battle throws at them before building or sending a team. V2's event page has no equivalent, so a V1 user who moves over loses the only in-planner way to see a battle's enemies and map, and has to go back to V1 or the wiki. The data is already in place: the API serves every battle's map id, power and waves in the `lre-battles` dataset, the event page already reads it for clear estimates and the token plan, and the map images already ship in `apps/web/public/game_catalog/le_maps/`.

## What Changes

- **Battles section on each lane tab.** Alpha, Beta and Gamma each gain a Battles section after the Synced progress grid and before the Eligibility leaderboard, for that lane only. A battle selector (numbered battles on desktop, a previous/next stepper on mobile) picks one battle; the selection is kept per lane while on the page, resets on another event, and defaults to the lane's first battle that is not complete in synced progress.
- **Battle preview.** For the selected battle: number, enemy power and total enemy count; the battle's map; and its waves in round order, each with its round, power and enemies. Each enemy shows its portrait, localized name, count and level (rank and stars from the NPC's stat ladder).
- **Enemy details.** Tapping an enemy opens a compact detail (popover on desktop, bottom sheet on mobile) with health, damage, armour, attacks and traits at that level, and a link to the full NPC page in the Library at the same variation and level.
- **Map.** Shown beside the waves on desktop and in a collapsed disclosure on mobile. A battle whose map has no image shows a "map not available" placeholder. The four maps V1 has that V2 is missing (`LE1_21`, `C1_70`, `C3_75`, `MC1_51`) are copied over; seven map ids used by Fabius Bile and none in V1 (`C4_02`, `C4_35`, `C4_66`, `EMC4_05`, `MC4_02`, `PVP_arctic_01`, `PVP_desert_06`) stay on the placeholder.
- **Enemy level resolution.** A wave enemy's served `ladderIndex` (renamed from the misleading `stars` by the companion API change) is read as a 1-based index into the NPC's served stat ladder, as V1 parsed `id:N`. An enemy whose id is unknown or whose index is past the ladder (four Lysander boss entries today) still shows with its count and an "unknown level" label, no stats.
- **Tour and i18n.** The event page tour gains a Battles step on the lane tab; all new copy in en/de/es/fr.

Out of scope: a Battles tab of its own (V1 layout), the rendered `_Visual` map variants, per-enemy repeated portraits (V2 shows one tile per enemy type with a count), linking progress-grid rows to the preview, battles for events not in the V2 catalog (V1's Dante, Trajann and Lucius).

## Capabilities

### New Capabilities

- `legendary-event-battle-preview`: the lane tab's Battles section: battle selection and its default, the battle header, the map and its unavailable state, waves and enemy tiles, enemy level resolution from the served ladder index, the enemy detail with its Library link, and loading, failure and missing-data states, on desktop and mobile.

### Modified Capabilities

- `legendary-events-hub`: a lane tab's section order gains the Battles section (between the Synced progress grid and the Eligibility leaderboard, which `legendary-event-synced-progress` already allows); the event page tour gains its step.

## Impact

- **Companion API change** `add-legendary-event-battle-preview` in `tacticus-planner-api` (applies first): renames the wave enemy `stars` to `ladderIndex` in raw and served `lre-battles` and bumps the catalog schema version. **BREAKING** for the client's `lre-battles` parse, so both halves merge together. Otherwise `lre-battles` (map id, power, waves) and `npcs` are already served and synced.
- `packages/game-catalog/src/schemas/lre.ts`: `lreEnemySchema` reads `ladderIndex` instead of `stars`.
- New `apps/web/src/fsd/pages/legendary-events/ui/legendary-event/battles/` (section, selector, wave list, enemy tile, enemy detail, map, view model), `entities/legendary-event` (pure battle-preview selectors: default battle, enemy level resolution, totals), `entities/npc` (an `useNpcsById` read hook and a compact stat summary reused by the detail), `@workspace/game-catalog` (a `legendaryEventMapImage(mapId)` asset helper next to `npcPortrait`), `legendary-event-page-view.tsx`, `legendary-event.tutorial.tsx`, locales `legendaryEvents.json` in four languages, four map images under `apps/web/public/game_catalog/le_maps/`.
- Docs: add the battle preview to `tacticus-planner-docs/product/features/lre-planning.md` when this change is archived.
- No infra change.
