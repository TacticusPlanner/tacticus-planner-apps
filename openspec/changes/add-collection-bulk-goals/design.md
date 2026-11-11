## Context

Collection lists units as `UnitTileUnit`s (owned: progression, rank, ability levels; unowned: starting rarity). Goal creation is one `POST /api/v1/goals` per unit (atomic, ≤10 specs, `dependsOnIndex`, optional `dependsOnGoalIds`). The Legendary Event plan wizard already creates several units' goals with one request per unit and a pending/done/failed checklist with Retry failed.

## Decisions

### D1. Owning slice

The existing `features/goal-create` slice owns the bulk code in its own segments (`model/bulk-create/`: plan builder, submit core and hooks; `ui/bulk-create/`: the dialog) and exports `BulkGoalDialog`, `BulkGoalUnit` and `bulkUnitKey` through its public API. A separate slice would put `features` over steiger's 20-slice threshold, and bulk creation is goal creation. The plan builder builds specs from `@workspace/game-domain` (`minProgressionForRank`, `minProgressionForAbilityLevel`, `startingProgression`) and `entities/goal` (`goalTargetKeyOf`, `goalTypesOverLimit`, `createCombinedGoals`), not from the single-goal form's model. The Collection page owns the selection state and renders the dialog.

### D2. One shared target, resolved per unit

The dialog has one target per goal type rather than V1's per-unit cards: it scales to dozens of units and Collection's filters already narrow the set to units that share a goal. Each unit's plan is derived from its current state:

- Unlock: only for a unit not owned, when "Unlock units you don't own" is on (default on); with it off such units are skipped. An in-flight Unlock goal is reused (`dependsOnGoalIds`).
- Ascension: start at the unit's progression (an unowned unit's starting progression), end at the target.
- Rank: characters only; start at the unit's rank (Stone I when not owned), clean boundaries, `TotalUpgrades`.
- Abilities: both tracks raised to the level (a track already there stays), clamped to the maximum.
- A Rank or Abilities target above the base progression's cap depends on the explicit Ascension when it reaches far enough, else on the lowest in-flight Ascension goal that does, else adds an Ascension to the progression it needs (shown as "added").
- A target not above the current value is skipped as reached; a target an in-flight goal of the same unit and type holds (`goalTargetKeyOf`) is skipped as already a goal.

### D3. Submission

Sequential, in list order, no `position` (appended), `projects` = the chosen project or null (Default). Each unit is atomic; the batch is not. Retry failed resends only failed units. Goal and project lists are invalidated once at the end.

### D4. Selection UI

Select mode wraps each tile/row in a page-level `SelectableUnit`: the tile is made `inert` and a full-size checkbox button covers it, so the shared `UnitTile`/`UnitRosterRow` stay untouched and the link can't be followed by accident. Desktop and mobile share it; the mobile roster's expandable rows are covered the same way. The bar is `sticky` at the bottom of the page, like the Goals page's mobile select bar, and sits above the bottom nav on mobile.

### D5. Not in this change

V1's per-unit overrides, pre-farm rarity filters, incremental ladders and order modes; a server bulk endpoint. Each selected unit can still be opened from Goals afterwards to add milestones.
