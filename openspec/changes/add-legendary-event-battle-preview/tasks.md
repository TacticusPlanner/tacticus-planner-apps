# Tasks

No companion API change: `lre-battles` and `npcs` are already served, synced and read by the event page.

## 1. Catalog: map assets

- [ ] 1.1 Copy `LE1_21.jpg` from V1 `src/assets/images/snowprint_assets/le_maps/` and `C1_70.jpg`, `C3_75.jpg`, `MC1_51.jpg` from V1 `.../quest_maps/` into `apps/web/public/game_catalog/le_maps/`; verify the four files open and are 296 px wide tactical maps (design D6).
- [ ] 1.2 Add a generator script in `packages/game-catalog/scripts` that writes `LE_MAP_IDS` (tactical `{mapId}.jpg` files only) and the `legendaryEventMap(mapId)` helper next to `npcPortrait`, exported from `@workspace/game-catalog`; verify a test asserts `LE_MAP_IDS` matches the directory listing, `legendaryEventMap("LE1_26")` returns the `le_maps` path and `legendaryEventMap("C4_35")` returns `undefined` (design D2, D6).

## 2. Entities: pure selectors, read hook, shared NPC UI

- [ ] 2.1 Add `entities/legendary-event/lib/battle-preview.ts` (`defaultBattleIndex`, `orderLaneBattles`, `sortedWaves`, `battleEnemyCount`) and export it; verify `battle-preview.test.ts` covers the first-incomplete default (Beta battles 1–6 complete → battle 7), no progress → battle 1, all complete → last battle, ordering by `battleIds`, round sorting, and the Lysander Alpha battle 1 count 7 + 4 + 5 + 6 + 4 + 6 = 32.
- [ ] 2.2 Add `entities/npc/lib/resolve-ladder-row.ts` (`resolveLadderRow`) and export it; verify `resolve-ladder-row.test.ts` covers Grot index 4 → row 3 (rank 2, stars 1, health 69), index 5 → row 4, index 0 → row 0, Helbrecht index 3 on a 2-row ladder → `undefined`, and an unknown NPC → `undefined`.
- [ ] 2.3 Add `entities/npc/model/use-npcs-by-id.ts` (`useNpcsById`) over `getNpcsMap` with pending / ready / failed states; verify a hook test covers each state.
- [ ] 2.4 Move `npc-level-badge.tsx` from `pages/library/ui/npcs/` to `entities/npc/ui/`, export it, and update the Library imports; verify the existing NPC Library tests pass unchanged and `pnpm lint:fsd` passes.
- [ ] 2.5 Add `entities/npc/ui/npc-stat-summary.tsx` (portrait, localized name and faction, level badge, health / damage / armour, melee and ranged attacks, localized traits for one variation and row); verify `npc-stat-summary.test.tsx` renders Grot at row 3 with health 69, damage 35, armour 0 and its traits.

## 3. Page: Battles section

- [ ] 3.1 Add `pages/legendary-events/ui/legendary-event/battles/battles.view-model.ts` joining the lane's battles, `useNpcsById` and the progress grid into header, wave and tile view models, with per-lane selection state that resets on event change (design D3); verify `battles.view-model.test.ts` covers the Lysander Alpha battle 1 tiles ("Grot ×7" at Stone III 1 star; "Grot ×3" and "Ork Boy"), the Helbrecht "Level unknown" tile, NPCs pending, Library link only for listed variations (`/library/npcs/grot?variation=orksNpc1Grot&level=3`), and selection kept per lane.
- [ ] 3.2 Add `battle-selector.tsx`: desktop toggle group with complete marks as sr-only text; mobile Previous / "Battle N of M" menu / Next with bounds; verify `battle-selector.test.tsx` covers every scenario of "Desktop and mobile select battles differently".
- [ ] 3.3 Add `battle-waves.tsx` and `enemy-tile.tsx` (header with power and enemy count formatted for the UI language, waves by round, tiles with ×N and level, empty wave line, accessible tile names); verify `battle-waves.test.tsx` covers the header, wave and empty-wave scenarios and "19,836,420".
- [ ] 3.4 Add `enemy-detail.tsx`: popover on desktop, bottom sheet on mobile, wrapping `NpcStatSummary` plus the Library link; verify `enemy-detail.test.tsx` covers both forms, focus return on close, the unlisted-NPC case and the unresolved case without stats.
- [ ] 3.5 Add `battle-map.tsx`: desktop column beside the waves, mobile collapsed "Map" disclosure whose open state survives battle changes, "Map not available" for `undefined` and on image error, lazy loading and "Map of {lane} battle {n}" alt text; verify `battle-map.test.tsx` covers the three map scenarios.
- [ ] 3.6 Add `battles-section.tsx` (`data-testid="legendary-event-battles"` on the heading) with the skeleton, error with Retry, and "No battle data for this lane yet" states, and render it in `legendary-event-page-view.tsx` between `ProgressSection` and `LeaderboardSection`, lane tabs only; verify `legendary-event-page.test.tsx` covers the lane section order, no section on Overview, and each loading / failure / missing-data scenario.

## 4. Tour and i18n

- [ ] 4.1 Add `step("battles", "top")` between `progressGrid` and `leaderboard` in `legendary-event.tutorial.tsx` with its `EVENT_TOUR_TARGETS` entry, the same step on desktop and mobile (design D4), and `tour.event.steps.battles.title` / `.content` in en/de/es/fr; verify the tutorial test lists the step in order on both forms.
- [ ] 4.2 Add `battles.*` keys to `legendaryEvents.json` in en/de/es/fr (heading, selector labels, "Battle N of M", complete, enemy power, enemy count plural, wave and round labels, no-enemies line, Level unknown, detail labels, Open in Library, Map, map alt text, Map not available, skeleton / error / no-data copy) with real German, Spanish and French translations; verify `legendary-events-translations.test.ts` passes.

## 5. Platform-independent verification

Data states: a signed-in profile with Lysander synced and some lanes partly cleared; a profile with no Lysander progress; Fabius Bile (missing maps) and Lysander Beta 13 (unresolved boss).

- [ ] 5.1 With the Aspire stack, open Lysander Beta and confirm the default battle is the first incomplete one per the synced progress grid, and with the no-progress profile that battle 1 is selected.
- [ ] 5.2 Compare Lysander Alpha battles 1, 7 and 18 against V1's Battles tab: same map, same waves and rounds, same enemies and levels, same power.
- [ ] 5.3 Open Fabius Bile Beta battle 2 and Lysander Beta battle 13 and confirm the map placeholder and the "Level unknown" tile.

## 6. Desktop verification (≥768px)

- [ ] 6.1 The selector shows battles 1–18 with complete marks; the map sits beside the waves; switching lanes keeps each lane's selection.
- [ ] 6.2 Clicking an enemy opens the popover with its stats; the Library link opens the NPC page at the same variation and level; the tour's Battles step highlights the section heading.

## 7. Mobile verification (<768px, same-origin iframe per the `tp-manual-ui-verification` skill)

- [ ] 7.1 Previous / Next and the battle menu work with touch-sized targets; the Map disclosure starts collapsed and stays open across battles; nothing scrolls horizontally on a 65-enemy battle.
- [ ] 7.2 Tapping an enemy opens the bottom sheet and closing it returns focus; the tour's Battles step scrolls the section into view under the sticky tab strip.

## 8. Gates

- [ ] 8.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check` all pass.

## Workflow follow-up

- Add the battle preview to `tacticus-planner-docs/product/features/lre-planning.md` when this change is archived.
- Archive the change after its review, as earlier LRE changes were.
