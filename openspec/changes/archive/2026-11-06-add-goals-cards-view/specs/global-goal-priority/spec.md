## MODIFIED Requirements

### Requirement: Owner can reorder from Goals

At or above 768px, every Active or Paused goal on the Goals page SHALL have an accessible drag handle that commits a completed move to the account-wide order. The handle sits in the row's leading cell in Table view and in the card header in Cards view. In Cards view a goal SHALL be movable to any position in the grid, including across grid rows, and the other cards SHALL shift in reading order (left to right, then top to bottom) to preview the drop.

Below 768px, a dedicated reorder mode SHALL collapse cards to identity and target and provide touch-sized drag handles. Entering it SHALL bring the reorder list into the visible viewport, and a Done/exit affordance SHALL remain reachable while interacting with lower rows.

Each completed move SHALL commit without a separate Save. Done SHALL only exit the mode and SHALL not be necessary to persist a drop. Filtering or grouping SHALL not silently change priority: a drop is interpreted against the visible list (see the filtered-list scenarios) and hidden goals keep their relative order. A move SHALL preserve a goal's status, membership, target, and dependency, even if a dependent precedes its prerequisite.

#### Scenario: Desktop cross-project move

- **WHEN** a desktop user drags a goal from project B ahead of a goal in project A
- **THEN** the global order is saved and reflected across project projections

#### Scenario: Desktop Cards view move across grid rows

- **GIVEN** Cards view at a width that shows three cards per row, with goals A, B, C in the first row and D, E, F in the second
- **WHEN** the user drags F onto B's position
- **THEN** the saved order is A, F, B, C, D, E and the grid shows it in reading order, the same result as the equivalent drag in Table view

#### Scenario: Keyboard move in Cards view

- **GIVEN** Cards view with keyboard focus on a card's drag handle
- **WHEN** the user picks it up, moves it with the arrow keys and drops it
- **THEN** the move commits like a pointer drag and the pick-up, move and drop are announced to assistive technology

#### Scenario: Mobile reorder mode

- **WHEN** a mobile user enters reorder mode and moves a collapsed card
- **THEN** the move saves immediately and exiting mode restores full cards

#### Scenario: Entering mobile reorder brings work into view

- **WHEN** a mobile user activates Reorder while the goal list is below the viewport
- **THEN** the reorder list is scrolled into view and a useful list or mode target receives focus
- **AND** reduced-motion settings are respected

#### Scenario: Finishing after moving a lower card

- **WHEN** a mobile user completes a drag near the bottom of a long reorder list
- **THEN** the move is committed without pressing Done, its pending/error state is perceivable near the list, and Done remains reachable without scrolling back to the original header

#### Scenario: Project-level reorder appears in the plan

- **GIVEN** global order A, B, C, D, E and a project showing A, C, E
- **WHEN** the user drags E above C on that project's page
- **THEN** Goals shows A, B, E, C, D and every execution consumer uses that order

#### Scenario: Filtered plan

- **GIVEN** global order A, B, C, D, E and a status, Type, or project filter that shows only A, C, and E
- **WHEN** the user drags E above C
- **THEN** the saved global order is A, B, E, C, D: E takes C's position, goals between them shift one place toward E's vacated slot, and the hidden goals keep their relative order

#### Scenario: Grouped list

- **GIVEN** Group is set to a dimension and a goal's group shows it after a neighbour
- **WHEN** the user drags it above that neighbour within the same group
- **THEN** it takes the neighbour's global position exactly as in the filtered case; dropping across a group boundary is not offered, in Table or Cards view

#### Scenario: Goals without a handle

- **WHEN** the list shows Completed, Reached-but-not-in-flight, or Archived goals
- **THEN** those rows or cards have no drag handle and cannot be moved
