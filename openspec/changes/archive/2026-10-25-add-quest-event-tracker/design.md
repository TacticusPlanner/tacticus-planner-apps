# Design

## Context

- The calendar has a `quest` definition (`type: Quest`, `durationHours` 72, `announcementLeadHours` 24, `rewardsClaimWindowHours` 24) and four occurrences, with Nubari running 2026-10-21 to 10-24.
- The companion API change serves `quest-events` (one record per featured hero, 17 battles with tier, position, deploy slots, board, grouped enemies, objectives and loot) and `quest-crates` (17 thresholds, the last one 8,800).
- The LE Battles section (`pages/legendary-events/ui/legendary-event/battles/`) already renders a map with fallback, enemy tiles with ladder-index levels and an enemy detail popover or sheet. Quests need the same pieces with one enemy list instead of waves.
- The HRE tab is the closest pattern: a `features/hre-missions` slice for instance selection, local-storage progress and UI, composed by `pages/dailies/ui/hre-page.tsx`, with `nav-live-dot.tsx` signals.
- Severyn's decisions: tiers are 3/3/5/3/2/1, Lightning Victory is entered as 0 to 100 points (the in-game screens show partial scores such as 499 / 500), objective scores come from the data, there is no quest data in the game API, and caps clamp stars, rank, abilities and items.

## Goals / Non-Goals

**Goals:**

- A tab a player keeps open for 72 hours: what have I scored, where are the points I'm missing, and what does each battle look like.
- A new quest needs only an occurrence and a `quest-events` record.

**Non-Goals:**

- Rewards, shards, tokens, teams and estimates (the three follow-up changes).
- Syncing progress across devices.

## Decisions

### D1. Slices: `features/quest-event` plus a shared `widgets/battle-preview`

`features/quest-event` owns instance selection, storage, scoring (pure `.ts`), the tracker, summary and detail UI, and `useIsQuestLive`. `pages/dailies/ui/quest-page.tsx` composes it with the header controls.

The LE map, enemy tile, enemy detail and enemy list move from `pages/legendary-events/.../battles/` into `widgets/battle-preview`, with props instead of LE types (`{ id, ladderIndex, count }[]`, a board image URL). LE's section keeps its selector and waves and renders the widget pieces. This is a pure move for LE, with no spec change, and it follows `rehome-feature-logic`, which put those files in the page because they had one consumer.

- _Alternative:_ copy the components into the quest feature. That was rejected because the enemy detail and level rules would drift between two copies.

### D2. Instance selection uses the definition config

`selectQuestInstance(calendar, definitions, now)` returns `{ occurrence, phase: "running" | "claim" | "preview" } | null`. The claim window length comes from `rewardsClaimWindowHours`, so a config change needs no code. The picker state is separate from the selection: browsing another quest never changes which occurrence the tracker writes to.

### D3. Scoring is one pure function

`scoreQuest(battles, entries, crates)` returns per battle `{ points, max, left }`, per tier totals, the total, the maximum, crates opened and the next crate. The rows, headings and summary read only that result, so they cannot disagree. Points are `100 × medals + lightning + Σ ticked scores`, and all are 0 with 0 medals. The follow-up changes add inputs to this function (estimates) instead of new totals.

### D4. Storage

The key is `tp.dailies.quest.progress.v1`, with the value `{ [occurrenceId]: { battles: { [number]: { medals, lightning, objectives } } } }`, guarded as in `use-hse-projection-inputs.ts`. Objectives are stored by position, matching the served order. If a data refresh changes a battle's objective count, the array is padded or cut on read. Later changes add sibling fields (`bundle`, `tokens`) to the same entry.

### D5. Board images

V1's 83 `quest_maps/*.jpg` are converted to `.webp` like `le_maps` and copied to `apps/web/public/game_catalog/quest_maps/`. `battleBoardImage(boardId)` replaces `legendaryEventMap` (kept as an alias for LE), with a known-ids list per folder like `le-map-ids.ts`. Some quest boards are LE boards (`LE3_24`), so the lookup falls through to `le_maps`.

### D6. Layout

- **Desktop:** the header row (hero, factions, countdown, picker), then two columns: the summary and the tier-grouped list on the left, and the detail of the selected battle on the right with the score inputs at its top.
- **Mobile:** one column: header, summary, tier disclosures. Tapping a battle opens a bottom sheet with the inputs and the detail. The picker collapses to an icon.

### D7. Live indicator

`useIsQuestLive` uses `selectQuestInstance` and is true only in the `running` phase. `nav-live-dot.tsx` gains `liveIndicator: "quest"`, and the Dailies parent ORs the three signals.

## Risks / Trade-offs

- [The game changes the score rules] → they are three constants in `scoreQuest`, and the 8,800 check in the API catches a data drift.
- [Progress is only in this browser] → accepted, as for HRE. A quest is 72 hours long, and re-entering 17 battles takes a minute.
- [A board image is missing] → the shared placeholder shows.
- [Moving the LE preview breaks LE] → the LE Battles tests run unchanged against the widget.

## Migration Plan

The API half ships first. Without it the tab shows "No battle data for this quest yet". Rollback is reverting either PR.
