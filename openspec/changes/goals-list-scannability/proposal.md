## Why

UserJot "V2 Goals Page Is Harder to Scan": the V2 Goals table looks busier than V1, with smaller unit icons and text; status is lumped together with the completion date in one small "Status · Done by" cell; and a wide progress bar takes the space the reader cares least about. The reader wants to see at a glance whether a goal is active or paused, what rank it targets, how much energy it needs, how many days it takes, and when it will be done.

No companion API change.

## What Changes

- Desktop table: "Status · Done by" splits into a **Status** column (larger status chip) and a **Done by** column (the date as the headline, the day count beneath).
- Column order becomes Character, Projects, Goal, Status, Done by, Remaining, Progress. Progress moves last and shrinks to a narrow fixed width.
- Larger unit avatars (desktop 48px, mobile 44px), larger rank/rarity emblems in the Goal column and the mobile goal line, larger resource chips (energy, gold, …), and a taller fixed row (`h-16`).
- Mobile card: the "Done by" caption keeps one line but renders at body size with the date emphasised.
- New `goals.columns.doneBy` string; `goals.columns.status` loses its "· Done by" suffix (en/de/es/fr).

## Capabilities

### Modified Capabilities

- `goal-list-layout`: column set/order, Status and Done by as separate columns, Progress last.

## Impact

- `pages/goals/ui/goals-board/{goals-list,goal-table-row,goal-row-shared,goals-mobile-cards}.tsx`, `pages/goals/ui/shared/{status-badge,goal-progress-visuals,goal-resource-chips}.tsx`, `shared/ui/progression-select.tsx` (`ProgressionBadge` gains a `size` prop).
- `public/locales/*/common.json`.
