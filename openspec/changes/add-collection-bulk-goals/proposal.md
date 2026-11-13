## Why

The UserJot post "Bulk Goal Creation" (44 votes, Planned) asks for multi-select on Collection and a dialog that creates goals for every selected unit at once, like V1's `/plan/bulkGoals`. V2 can only create goals for one unit at a time. Collection already has the filters and quick filters (Ready to rank up, Need to ascend, Can ascend, rank and star ranges, faction, rarity) that V1's "Add Ready to Rank Up" and "Add team" buttons stood in for, so selection belongs there. Selection and the dialog ship together: selection has no use without the dialog.

No companion API change: the client sends one existing combined create request per unit, as the Legendary Event plan wizard does.

## What Changes

- **Select units** on Collection (signed in, roster synced, Compare off), at every width. Select mode puts a checkbox on every tile and row; activating a tile or row toggles it instead of opening the unit page. A bar pinned to the bottom of the viewport shows the count, Select all shown, Clear, **Create goals** and Done. The selection survives filter, sort and view changes, so filters can be combined across several passes.
- A **Create goals** dialog (centered dialog ≥768px, bottom sheet below) with one shared target applied to every selected unit: Ascension to a progression, Rank to a rank (characters), Abilities to a level (both tracks), and Unlock for selected units the roster doesn't hold. A destination project (Default by default).
- Each unit gets its own plan from its current state: a target already reached, already held by an in-flight goal of that unit and type, or not applicable (Rank on a Machine of War) is skipped with its reason. A Rank or Abilities target above the unit's rarity cap adds the Ascension it needs, or depends on an in-flight Ascension goal that already reaches it. A unit can be taken out of the list.
- The dialog sums the new goals per type against the 200-per-type cap and refuses to submit over it.
- Create sends one combined request per unit, in list order, appended to the end of the priority order. Each unit shows pending, done or failed (with the reason); **Retry failed** resends only the failed units.
- Analytics: `collection_bulk_goals_created` (unit count, goal count, failed unit count).
- Collection's tour gains a Select units step. Copy in en, de, es, fr.

## Capabilities

### Modified Capabilities

- `player-collection`: select mode, its bar, and the selection rules.
- `goal-creation-entry-points`: the Collection bulk creation dialog.

## Impact

- New `bulk-create` segments in `apps/web/src/fsd/features/goal-create` (plan builder, submit hook, dialog).
- `pages/my-game/ui/collection/*`: select mode, selectable tile/row wrapper, select bar, tour step.
- `shared/analytics`: the new event.
- `public/locales/{en,de,es,fr}/common.json`.
