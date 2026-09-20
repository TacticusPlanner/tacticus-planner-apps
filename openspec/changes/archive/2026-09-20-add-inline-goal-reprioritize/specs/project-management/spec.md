## REMOVED Requirements

### Requirement: Users prioritize units rather than goals

**Reason**: Priority moves from unit granularity to goal granularity — every goal is independently, directly reorderable. Replaced by "Goals are reordered individually via inline drag" and "Mobile reordering uses a dedicated reorder mode" under ADDED Requirements below.

**Migration**: The "Reprioritize units" dialog/Sheet is removed. A user who previously dragged a unit block now drags an individual goal row (desktop) or uses the new mobile reorder mode; there is no longer a minimum-unit-count gate or a save/cancel step — each drag commits immediately.

### Requirement: Goal order inside a unit is automatic

**Reason**: No ordering is automatically computed from dependencies anymore. A goal's position is exactly what the user (or its append-on-creation default) puts it at, independent of any `DependsOn` relationship.

**Migration**: A user who wants a dependency-respecting order now sets it explicitly via drag, the same as any other reordering. Nothing prevents positioning a goal ahead of an unreached prerequisite; that goal's blocked/restricted state (a separate, unaffected concern) is unchanged by its position.

### Requirement: Unit order drives priority-sensitive calculations

**Reason**: Replaced by "Goal order drives priority-sensitive calculations" under ADDED Requirements below — the calculation behavior is unchanged (higher-priority goals still claim shared inventory first), only the "unit order" framing is retired since there is no more unit grouping to frame it by.

**Migration**: None for calculation behavior — Dailies, Raids Plan, Insights, and farming estimates keep consuming the same flattened, priority-ordered goal list; only its description changes from "unit order" to "goal order."

### Requirement: Sort orders unit blocks rather than their contents

**Reason**: Replaced by "Sort orders individual goals; Group=Unit is a display-only clustering" under ADDED Requirements below, reflecting that Group=Unit no longer corresponds to a stored grouping — it is purely a rendering choice over the flat per-goal priority list.

**Migration**: A project grouped by unit still visually clusters goals by unit, but that clustering and its internal order are now derived at render time from the flat per-goal priority list, not from a separate stored unit order.

## MODIFIED Requirements

### Requirement: Project management is deliberately responsive

At or above 768px, project cards SHALL use a comparison-friendly grid and each goal row SHALL show an inline drag handle for direct reordering. Below 768px, cards and headers SHALL stack, primary actions SHALL remain labeled and touch-sized, and reordering SHALL use a dedicated reorder mode (see "Mobile reordering uses a dedicated reorder mode" below) rather than a dialog or Sheet.

#### Scenario: Desktop drag handle

- **WHEN** project detail renders at or above 768px
- **THEN** each goal row shows a drag handle usable to reposition that goal directly, with no separate reorder mode or trigger required

#### Scenario: Mobile unit drag surface

- **WHEN** reprioritization opens below 768px
- **THEN** there is no dedicated unit-drag Sheet — the reorder mode described below collapses cards in place and each collapsed card, not a unit block, has its own clearly labeled, touch-sized drag handle, and the full list remains scrollable

#### Scenario: Mobile reorder mode replaces the unit-drag Sheet

- **WHEN** the user activates reordering below 768px
- **THEN** the reorder mode described below opens in place, not a full-height Sheet containing unit drag handles

## ADDED Requirements

### Requirement: Goals are reordered individually via inline drag

On a viewport at or above 768px, every in-flight goal row on the project detail route SHALL show a drag handle. Dragging a row directly changes its position in the project's flat priority order. Each completed drag SHALL commit immediately — there SHALL be no separate save step and no confirmation dialog. A goal MAY be dragged to any position, including ahead of a goal it `DependsOn` that has not yet been reached; that goal's blocked/restricted state is unaffected by its position.

#### Scenario: Dragging a goal commits immediately

- **GIVEN** a project detail route with at least two in-flight goals
- **WHEN** the user drags one goal row to a new position and releases it
- **THEN** the new priority order is saved without any further confirmation step

#### Scenario: A goal can be moved ahead of its own unreached prerequisite

- **GIVEN** a Rank goal that `DependsOn` an unreached Ascension goal for the same unit
- **WHEN** the user drags the Rank goal above the Ascension goal
- **THEN** the drag succeeds, and the Rank goal's Restricted indicator (from `goal-blocker-reasons`) remains present, unaffected by the new position

### Requirement: Mobile reordering uses a dedicated reorder mode

Below 768px, the project detail route SHALL offer a button that toggles a reorder mode. Activating it SHALL collapse every goal card to its minimal identifying information (at least the unit's name/avatar and the goal's from → to representation) and make each card directly draggable in place. There SHALL be no separate dialog, Sheet, or Save action — each completed drag SHALL commit immediately, the same as the desktop drag handle. Deactivating the reorder mode (via the same button, or navigating away) SHALL restore cards to their full, non-reorderable presentation.

#### Scenario: Entering reorder mode collapses cards

- **GIVEN** a project detail route below 768px with at least two in-flight goals
- **WHEN** the user activates the reorder button
- **THEN** every visible goal card collapses to its minimal information and becomes draggable

#### Scenario: A drag in reorder mode commits without a Save step

- **GIVEN** reorder mode is active
- **WHEN** the user drags one collapsed card to a new position
- **THEN** the new order is saved immediately, with no Save button and no confirmation step

#### Scenario: Exiting reorder mode restores full cards

- **GIVEN** reorder mode is active
- **WHEN** the user deactivates it
- **THEN** every card returns to its full, non-reorderable presentation

### Requirement: Goal order drives priority-sensitive calculations

The ordered project-goal list consumed by Dailies, Raids Plan, Insights, and farming estimates SHALL be the same flat, per-goal priority order shown by project detail. No consumer SHALL independently sort it into a different execution order.

#### Scenario: Shared inventory follows goal order across units

- **GIVEN** two goals for different units need the same resource and available inventory covers only the first goal in priority order
- **WHEN** the plan is calculated
- **THEN** inventory is applied to the higher-priority goal first, regardless of which unit it belongs to

### Requirement: Sort orders individual goals; Group=Unit is a display-only clustering

When project detail is grouped by unit, the goals within each unit's visual cluster SHALL render in their existing flat priority order (not a separately computed order), and the Sort selection SHALL determine the order of the clusters themselves. Under every other grouping dimension, Sort SHALL order the goals directly, as it does elsewhere. Group=Unit and Sort SHALL NOT alter the stored per-goal priority order — they are rendering choices over it.

#### Scenario: A unit's goals keep their priority order inside its cluster

- **GIVEN** a project grouped by unit, where one unit has two goals whose flat priority order is A then B
- **WHEN** that unit's cluster renders
- **THEN** goal A renders above goal B inside the cluster, regardless of the Sort selection

#### Scenario: Drag is confined to a goal's own cluster while grouped by unit

- **GIVEN** a project grouped by unit, with clusters for units X and Y
- **WHEN** the user drags a goal belonging to unit X
- **THEN** the drag only reorders that goal among the other goals already in unit X's cluster — there is no drop target outside unit X's cluster, so the drag cannot move the goal into unit Y's cluster or to a flat-order position between unit Y's goals; a true cross-unit reorder requires switching to no grouping or Group by type first

#### Scenario: Sort reorders the clusters themselves

- **GIVEN** a project grouped by unit
- **WHEN** the user changes the Sort selection
- **THEN** the order of the unit clusters changes accordingly, without changing any goal's stored priority

#### Scenario: Sort applies normally without unit grouping

- **GIVEN** a project grouped by goal type or not grouped
- **WHEN** the user changes the Sort selection
- **THEN** the goals are ordered by that selection
