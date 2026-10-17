# Design

## Context

See proposal.md for motivation; behaviour is in `specs/legendary-event-battle-preview/spec.md` and the `legendary-events-hub` delta.

- The event page (`pages/legendary-events/ui/legendary-event/legendary-event-page.tsx`) already reads `useLegendaryEventBattles(eventId)` (entity hook over `getLegendaryEventBattles`) for clear estimates and the token plan, so the battle bodies are loaded on every event page visit.
- A served battle (`lreBattleViewSchema`) carries `id`, `lreId`, `track`, `mapId`, `number`, `power`, `tier`, `disallowedFactions` and `waves[] { round, power, enemies[] { id, stars, count } }`. The API aggregates V1's repeated `"{npcId}:{N}"` strings into `{ id, stars: N, count }` (`game-catalog-data` skill). The companion API change renames `stars` to `ladderIndex` (its design D2 explains the name); this change reads `ladderIndex`.
- On the served data (four events, 216 battles, 3,048 enemy entries) `stars` runs from 1 to 56, so it is V1's ladder index, not a star count; four entries (Lysander bosses `templBossHelbrecht`, `templBossSwordBrother`, `blackBossTerminatorLEG`, `blackBossAbaddonLEG`) point past their ladder. Every enemy id exists in `npcs`.
- `npcs` is read today only inside `pages/library` (`use-npcs-catalog.ts`) and the daily-raids feature (`getNpcsMap` through `useLiveQuery`). `entities/npc` exposes `NpcPortrait`, `useNpcLabels`, `npcSlug`, `buildNpcGroups`, `isVariationAvailable` but no read hook.
- 185 files ship in `apps/web/public/game_catalog/le_maps/` (tactical `{mapId}.jpg`, 296×408, plus unused `{mapId}_Visual.jpg`). Of the 83 map ids the four catalog events use, 72 have an image; V1 has `LE1_21` (le_maps) and `C1_70`, `C3_75`, `MC1_51` (quest_maps) that V2 lacks; 7 exist nowhere.

## Goals / Non-Goals

**Goals:**
- V1 parity for "what does this battle look like": map, waves, enemies, levels, per-enemy stats.
- No new network read: reuse the page's `lre-battles` read and the synced `npcs` store.

**Non-Goals:**
- Refactoring the Library's NPC detail into a shared widget. The battle detail is a compact summary that links to the Library for everything else.
- Changing the served `lre-battles` shape.

## Decisions

### D1. A section on each lane tab, not a fifth tab

V1 had a Battles tab with its own Alpha/Beta/Gamma switch. V2's lane tabs already select the lane, so the preview is a section of the lane tab, placed after the Synced progress grid (both are "per battle") and before the leaderboard. Alternative: a Battles tab beside Overview with its own lane switch; rejected because it duplicates the lane selector and breaks the "a lane tab shows everything about the lane" rule of `legendary-events-hub`.

### D2. Ownership in FSD

- `entities/legendary-event/lib/battle-preview.ts` (pure, exported): `defaultBattleIndex(laneProgress, battleCount)`, `orderLaneBattles(lane, battles)` (by the lane's `battleIds`), `sortedWaves(battle)`, `battleEnemyCount(battle)`.
- `entities/npc/lib/resolve-ladder-row.ts` (pure, exported): `resolveLadderRow(npc, ladderIndex) → { servedIndex, row } | undefined` implementing the 1-based rule (≤ 0 reads row 0, past the end is undefined). It is an NPC concern, so it lives on the NPC entity and the legendary-event entity does not import another entity.
- `entities/npc/model/use-npcs-by-id.ts`: `useNpcsById()` over `getNpcsMap` with the repo's live-query pattern, returning pending / ready / failed like the other entity read hooks. Daily raids and the Library keep their own reads (not migrated in this change).
- `entities/npc/ui/npc-level-badge.tsx`: moved from `pages/library/ui/npcs/` unchanged (rank icon + stars visual for a ladder row) and exported, so the tile, the summary and the Library share one level rendering; the Library imports it from `@/entities/npc`.
- `entities/npc/ui/npc-stat-summary.tsx`: portrait, name, faction, level, health / damage / armour, attacks, traits for one `(variation, row)`, using `useNpcLabels` and the shared ability-text helpers.
- `pages/legendary-events/ui/legendary-event/battles/`: `battles-section.tsx`, `battle-selector.tsx` (desktop and mobile forms), `battle-waves.tsx`, `enemy-tile.tsx`, `enemy-detail.tsx` (popover / sheet wrapper around `NpcStatSummary` plus the Library link), `battle-map.tsx`, `battles.view-model.ts` (joins battles, NPCs and progress into tile view models; the only place both entities meet).
- `@workspace/game-catalog`: `legendaryEventMap(mapId): string | undefined` next to `npcPortrait`, returning `${ASSET_BASE_PATH}/le_maps/${mapId}.jpg` only for ids in a generated `LE_MAP_IDS` set, so a map known to be missing renders the placeholder without a 404. The `<img onError>` fallback still covers a listed file that fails to load.

### D3. Selection state

The page view model holds `selectedBattleByLane: Partial<Record<LaneId, number>>`, created with the event and dropped when `eventId` changes (the same lifetime as the selected tab). A lane missing from the map uses `defaultBattleIndex`, computed from the synced progress grid the page already builds, so the default follows sync without being written back. Not in the URL: the selected tab is not in the URL either.

### D4. Desktop and mobile split

- **Desktop (≥ 768px):** a single-choice toggle group of battle numbers 1–N (wraps on narrow desktop widths); complete battles carry a check icon and an sr-only "complete". Below it a two-column layout: map (fixed 296 px column) left, header and waves right. Enemy details open in a `Popover` anchored to the tile.
- **Mobile (< 768px):** Previous / "Battle N of M" (a `DropdownMenu` trigger listing all battles) / Next. Header, then a collapsed `Collapsible` "Map", then waves. Enemy details open in a bottom `Sheet`.
- **Joyride:** one target, `[data-testid="legendary-event-battles"]` on the section heading, on both forms, so the shared step list in `legendary-event.tutorial.tsx` gains `step("battles", "top")` between `progressGrid` and `leaderboard` and no form-specific selector.

### D5. Enemy tiles

One tile per served entry with a ×N badge instead of V1's repeated scaled portraits: the API already aggregates, and a 65-enemy battle would otherwise draw 65 portraits on a phone. Level shows as the rank icon plus star count used by the NPC Library's level badge. Tiles are buttons with an accessible name "Grot, 7, Stone III 1 star".

### D6. Map assets

Copy `LE1_21.jpg` from V1 `le_maps` and `C1_70.jpg`, `C3_75.jpg`, `MC1_51.jpg` from V1 `quest_maps` into `apps/web/public/game_catalog/le_maps/` (tactical images, V1 only ever showed these). `LE_MAP_IDS` is generated from the directory listing (tactical files only) by a small script in `packages/game-catalog/scripts`, and a unit test asserts it matches the directory so a newly copied map is not silently ignored. The `_Visual` files stay unused.

### V1-parity checklist

| V1 element | Decision |
| --- | --- |
| Battles tab with ALPHA/BETA/GAMMA radio switch | Redesign: section on each lane tab (D1) |
| Battle range slider, "Battle N" label | Redesign: number toggle group (desktop), stepper + menu (mobile) |
| Default battle 1 | Redesign: first incomplete battle from sync |
| Header: track badge, "Battle N", Total Enemy Power | Keep (power and number); track is the tab; add total enemy count |
| Show/Hide Map button, map hidden by default, `le_maps/{mapId}.jpg` | Keep the asset ids; desktop shows the map, mobile keeps it collapsed |
| Map missing (V1 rendered a broken image) | Redesign: "Map not available" placeholder |
| Waves sorted by round, "Wave N \| Round R", power per wave | Keep |
| "No Enemies This Wave" / "The battle continues…" | Keep as one "No enemies in this wave" line |
| "No wave data found." | Keep as the lane/battle missing-data state |
| One scaled `NpcPortrait` per enemy instance | Redesign: one tile per enemy type with ×N |
| Unresolved enemy rendered as red "Error: {id}" | Redesign: tile with "Level unknown" |
| `NpcDetailModal` on click (stats for the level) | Redesign: popover / sheet with summary and Library link |
| `disallowedFactions`, `tier`, `objectives` per battle | Drop: the lane's allowed rule and objectives are already in the Lane overview |
| V1 events without V2 catalog data (Dante, Trajann, Lucius) | Drop (catalog-scope rule in `lre-planning.md`) |

## Risks / Trade-offs

- [The API rename breaks the client's `lre-battles` parse until the schema follows] → the `lreEnemySchema` update is task 1.1 of this change, and both halves merge together after the API half applies.
- [The ladder index rule is wrong for some boss ladders (four entries point past the end)] → they render "Level unknown" rather than a wrong level; V1 showed an error for the same entries, so this is no regression.
- [Popover on a tile in a scrolling list on desktop] → Radix popover with collision handling; closes on scroll-away like the leaderboard's menus.
- [34 MB of maps in `public/`] → already shipped; four files add about 130 KB. Images use `loading="lazy"`.

## Migration Plan

Frontend only, additive. No data migration; rollback is a revert.

## Open Questions

- Source the seven map ids with no image anywhere (Fabius Bile's Beta and Gamma, and two Alpha battles) from a newer datamine; the placeholder covers them until then.
