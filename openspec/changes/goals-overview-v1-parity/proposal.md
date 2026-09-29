## Why

V1's goals table reads at a glance: a reached goal is visibly done (green row,
check mark, its cost columns dashed out), and the cost columns show icons
(orbs, badges, forge badges, components, coins) rather than sentences. V2's
Goals list shows a reached goal as a normal row with an "Active"/"Paused"
badge, and its Remaining column is prose ("9 slots · 1,674 energy",
"6 levels · 1,304,192 XP") that omits most of what a goal needs — MoW ability
badges/forge badges/components/gold and character ability badges/gold are not
computed or shown at all. This change brings those V1 behaviours into V2's
Goals list without changing how priority, pausing or estimates work.

## What Changes

- **Status filter**: remove the "Archived" option from the shared status filter
  (Overview and Project Detail), leaving Unfulfilled, Reached, Blocked,
  Active, Paused.
- **Reached rows**: a goal whose target is reached is no longer hidden or
  shown as a regular row wherever it appears. It renders with a green-tinted
  background and a completed check mark, its status label reads "Reached"
  instead of "Active"/"Paused" (display only — the stored status is
  unchanged), and its Progress, Remaining and "Done by" values render as "-".
  Its pause/resume control is not shown.
- **Remaining column**: replaced by icon chips of what the goal still needs,
  each with a tooltip: XP books (when a level-up is needed, from the existing
  available/needed count), energy, gold, orbs, shards, upgrade materials,
  ability badges, forge badges and MoW components. The "slots" text and the
  "N XP" text are removed.
- **Projects column and notes**: on the desktop table, project badges move out of the Character cell into a standalone Projects column between Character and Goal, and the notes render on a single truncated line directly under the unit name, where the goal-type caption used to be. The table goes from six to seven columns; the mobile card is unchanged.
- **Goal column encodes the type (V1 logic)**: the goal-type word ("Rank", "Ability", "Unlock") is removed from the Character column and the mobile card caption; the Goal column carries it instead — rank emblems without the rank name, star/rarity icons, labelled track pills for Ability, and "Unlock" (with its shard count moved to Progress) for Unlock.
- **Ability goal target**: the Goal cell of an Ability goal shows one labelled pill per ability track being raised ("PRIMARY 47 → 50", "SECONDARY 12 → 15", as V1 does) instead of a single unlabelled "Lv X → Y" for the wider track.
- **Missing costs**: sum MoW Ability costs (gold, ability badges, forge
  badges, components) from the existing `mow-upgrade-costs` dataset, and add
  Character Ability costs (gold, ability badges), which need a new catalog
  dataset ported from V1's ability level-up table.
- **Archive removed**: the row menu's Archive and Unarchive items are removed with the Archived filter option, so a goal can no longer be archived from the UI.
- **Per-goal status toggle**: no new control — Overview already renders the
  pause/resume button through the shared row actions; the only change is that
  it is hidden on reached rows.
- **Ordering**: this change is applied after `show-xp-book-availability-per-goal`
  (now archived), whose available/needed book figure it re-presents as a chip.

**BREAKING**: archiving is removed from the UI (filter option and row actions). Goals already stored as `Archived` stay untouched in the backend and are no longer listed anywhere.

## Capabilities

### New Capabilities

- `goal-remaining-resources`: the icon-chip Remaining column — which
  resources appear for each goal kind, their have/required and tooltip
  behaviour, and the reached-row "-" placeholders.
- `character-ability-costs-catalog`: the per-level gold and badge cost ladder
  for a character's ability levels, served as a game-catalog dataset and
  consumed by the goal resource calculation.

### Modified Capabilities

- `goals-navigation`: the shared status filter's option set and the reached
  indicator (no Archived).
- `goal-list-layout`: no goal-type caption (Character column, mobile header); new Projects column and one-line notes under the name (six to seven columns); Goal column encoding by kind; reached-row presentation on desktop table and mobile
  card; Remaining column content; Ability goal track pills in the Goal cell.
- `goal-status-actions`: pause/resume not shown on a reached goal; the Archive requirement is removed.
- `goal-progress-display`: "Remaining resource text uses a per-goal-kind
  formatter…" and the level requirement's remaining text drop "slots" and
  "XP" in favour of chips.

## Impact

- Apps (`tacticus-planner-apps`): `entities/goal/ui/status-filter-select.tsx`,
  `pages/goals/ui/goals-board/{goals-page,goals-list,goals-mobile-cards,goal-row-actions,goal-row-utils}.tsx`,
  `pages/goals/ui/shared/{goal-remaining-text,goal-progress-visuals,status-badge,level-requirement-display}.tsx`,
  `features/goal-farming/lib/{goal-need,goal-requirements,mow-ability-calc,progression-cost-calc}.ts`
  (`ResourceNeed` gains gold/badge/forge/component fields),
  `packages/game-catalog` (new dataset key and schema), locale files for
  `en`/`de`/`es`/`fr`.
- Cross-repo: the Character Ability cost dataset needs a companion API change of
  the same name, `goals-overview-v1-parity`, in `tacticus-planner-api`
  (new dataset in `GameCatalogDatasets.cs` and its endpoint, seeded from V1's
  `abilitiesLvlUp` table). Per the workspace convention the API half applies
  first. That companion change is scaffolded and valid.
- Archive order: after `add-goals-overview-density-option` if it lands first,
  since both edit the desktop row/cell structure of `GoalsTable` (this change also raises the column count from six to seven, which the density change's "six-column table contract" wording must be updated for); that change's "drop the goal-type subtext" density rule becomes moot here and must be reconciled when the second of the two archives.
- No data migration; V1 is not touched.
