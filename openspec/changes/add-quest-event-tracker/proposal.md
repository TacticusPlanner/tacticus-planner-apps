# Proposal

## Why

Quest Events run for 72 hours every few weeks: 17 hand-made battles from Common to Mythic, a featured hero who must be deployed in every battle, and a score out of 8,800 that opens up to 17 crates and up to 51 featured-hero shards (153 with the Quest Bundle). V1's `/plan/quests` lists the battles, maps and drops, but it does not know which quest is running and it shows no score at all, though the score is what players optimise. V2 has the quest in its calendar (Nubari is running now, 2026-10-21 to 10-24) and nothing else. This change gives V2 a Quest tab that shows the running quest, lets the player track each battle's score, and shows any battle's board, enemies, objectives and drop. It is the first of four changes; rewards, teams and clear estimates follow (see Impact).

## What Changes

- New Dailies **Quest** tab at `/dailies/quest`, directly after HRE. It shows the running quest, the quest in its 24 h claim window, or the next quest as a labelled preview. A quest picker browses every quest in the catalog, as V1's hero picker did.
- **Header**: featured hero (portrait, name, owned or not, current shards), allowed and enemy factions, the countdown, and a claim-window warning.
- **Battle tracker**: the 17 battles grouped by tier in play order (Common first). For each battle, the player records their best attempt: medals 0 to 3, Lightning Victory as a full-HP toggle (100 or 0), and a tick per bonus objective. Saved in local storage per occurrence, like HRE. The tab shows points out of 8,800, points left per battle, crates opened and the points to the next crate.
- **Battle detail**: select a battle to see its board, enemies with level and stats, the rarity cap, deploy slots, Lightning Victory turns, objective chips with their scores, and its drop with odds and goal need (have / need, and up to 3 units that need it). It is built from a new shared `widgets/battle-preview`, split out of the Legendary Event Battles section with no change to LE.
- **Board images**: V1's 83 `quest_maps` are added to the asset base, and the LE map helper becomes a board-image lookup over both folders.
- **Live indicator**: the Quest tab and Dailies show the shared "event live" dot while a quest runs.
- Tour and i18n: a new `quest` namespace in en, de, es and fr.

Out of scope here, in the follow-up changes: the crate rewards card, the shard projection and the token plan (`add-quest-event-rewards`), team suggestions (`add-quest-event-teams`), and clear estimates (`add-quest-event-clear-estimates`). Syncing progress: the game API has no quest data (confirmed).

## Capabilities

### New Capabilities

- `quest-event-tracker`: which quest the tab shows, the picker, the header, the per-battle score entry and its storage, and the points and crate summary.
- `quest-event-battle-detail`: the selected battle's board, enemies, cap, slots, objectives and drop with goal need, on desktop and mobile.

### Modified Capabilities

- `dailies-navigation`: adds the Quest tab after HRE, so the primary tabs become Raids, HSE, HRE, Quest, Shops, Guild Raids, with its live indicator.
- `app-navigation`: the live indicator on the Quest entry, and on Dailies while an HSE, an HRE or a quest runs.

## Impact

- **Companion API change** `add-quest-event-tracker` in `tacticus-planner-api` (applies first): serves `quest-events` and `quest-crates`.
- `packages/game-catalog`: zod schemas and sync for both datasets; `legendaryEventMap` generalised into `battleBoardImage(boardId)` over `le_maps` and the new `quest_maps`; 83 board images under `apps/web/public/game_catalog/quest_maps/`.
- New `apps/web/src/fsd/features/quest-event` (instance selection, storage, scoring, tracker and summary UI), new `widgets/battle-preview` (map, enemy tile, enemy detail, enemy list, moved from `pages/legendary-events/ui/legendary-event/battles/`), `pages/dailies/ui/quest-page.tsx` with its tutorial, the dailies route, nav items and `nav-live-dot.tsx`.
- Reads `goal-farming` need through its public API for the drop's have / need, as HSE and HRE do.
- `apps/web/public/locales/*/quest.json` (new) in four languages.
- Follow-ups, all apps only and reading the same datasets: `add-quest-event-rewards`, `add-quest-event-teams`, `add-quest-event-clear-estimates`.
- Docs: add the Quest tab to `tacticus-planner-docs` when archived.
- No backend storage. Progress stays in the browser.
