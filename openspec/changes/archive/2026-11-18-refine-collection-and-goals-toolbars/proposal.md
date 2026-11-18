## Why

Review of the page toolbar rollout on Collection and Goals found rough edges: Collection's quick-filter chips wrapped onto a second row on desktop and gave no hint of how many units each would list; the snapshot and select controls had not moved into the toolbar; Goals selected goals differently from Collection; "Type by priority" was a Group by option doing a sort's job; the order explanation was a toolbar info icon; and the mobile Reorder and Select buttons were icons without text.

## What Changes

- Collection: quick-filter chips stay on one line at every width and show how many units each would list.
- Collection: Compare, Take snapshot and Manage snapshots become one **Snapshots** menu in the toolbar's Find slot; **Select units** moves there too.
- Goals: selection is a select mode at every width, entered from a **Select goals** button and run from a select bar at the bottom of the viewport, like Collection. No checkboxes outside select mode.
- Goals: new **Sort** (Priority / Finish date) in the View slot. Group by follows the sort; "Type by priority" is removed. Dragging works only under Priority; otherwise a notice above the list explains why and offers **Sort by priority**.
- Goals: the order info icon is removed; its explanation is part of the page tour.
- Goals: the mobile Reorder and Select goals buttons show text labels.

## Capabilities

### Modified Capabilities

- `player-collection`, `roster-snapshot-management`, `collection-snapshot-compare`: chip counts and one-line chip row, Snapshots menu, Select units in the toolbar.
- `goals-navigation`, `global-goal-priority`, `goal-bulk-actions`, `goal-list-layout`: Sort, select mode at every width, order explanation in the tour, labelled mobile buttons.

## Impact

- `apps/web`: Collection toolbar, quick-filter chips, compare bar and tour; Goals toolbar, select button and bar, sort control, reorder notice, row grouping and ordering, and tour; `common` copy in en, de, es and fr.
- Stored Goals grouping `typePriority` falls back to None. New per-device key `goals.overview.sort`.
- No API changes.
