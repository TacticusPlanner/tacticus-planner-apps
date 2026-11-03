# project-goal-moves Specification

## ADDED Requirements

### Requirement: Move goals places a project's goals as one block

**Move goals…** SHALL open a dialog with three choices: **To the top**, **Before** a project, **After** a project, the last two with a project select. Confirming SHALL move the project's in-flight goals (Active and Paused) as one block, in their current relative order, and keep every other goal's relative order. Statuses SHALL NOT change. The move SHALL commit at once as one order update and be announced with the block's new first priority.

#### Scenario: Order worked example

- **GIVEN** the in-flight order is A (Team Lavi), B (GW S29), C (Chaos Core), D (GW S29), E (Chaos Core), F (Team Lavi)
- **WHEN** the user moves Chaos Core To the top
- **THEN** the saved order is C, E, A, B, D, F and the page announces "Moved 2 goals to priority 1."
- **AND** moving Chaos Core Before GW S29 from the original order saves A, C, E, B, D, F (B is GW S29's first goal)
- **AND** moving Chaos Core After GW S29 from the original order saves A, B, D, C, E, F (D is GW S29's last goal)

#### Scenario: Paused goals move and stay paused

- **GIVEN** Chaos Core holds an Active goal and a Paused goal
- **WHEN** the user moves Chaos Core To the top
- **THEN** both are first in the order and the Paused goal is still Paused

### Requirement: Shared goals follow the moved project unless they are also in the reference

A goal in the moved project and in other projects SHALL move with the block. A goal that is in both the moved project and the reference project SHALL stay where it is.

#### Scenario: Goal in both projects

- **GIVEN** goal G is in Chaos Core and GW S29, and the order is A, G, B (GW S29), C (Chaos Core)
- **WHEN** the user moves Chaos Core Before GW S29
- **THEN** the saved order is A, C, G, B: G keeps its place, and C is placed before G, GW S29's first goal

### Requirement: The reference list offers only usable projects

The Before and After select SHALL list the non-archived projects, other than the moved one, that hold at least one in-flight goal not also in the moved project, by name. When there is none, Before and After SHALL be disabled with "No other project to place against". To the top SHALL be disabled when the block is already first.

#### Scenario: Nothing to place against

- **GIVEN** every other project is archived or empty
- **WHEN** the user opens Move goals…
- **THEN** only To the top is enabled

### Requirement: A project move can be undone

After a move, a toast SHALL offer **Undo** for 10 seconds. Undo SHALL restore the previous order only when the order has not changed since the move. Otherwise it SHALL show "The order changed since. Nothing was undone." and change nothing. There SHALL be no confirmation before the move.

#### Scenario: Undo after a later reorder

- **GIVEN** the user moved Chaos Core To the top and then dragged another goal
- **WHEN** they activate Undo on the toast
- **THEN** the order stays as it is and the toast reads "The order changed since. Nothing was undone."

### Requirement: Move goals opens from the project's surfaces

**Move goals…** SHALL be offered in the Projects row menu of every non-archived project with at least one in-flight goal, and in the scoped Goals header for that project, on desktop and mobile. On desktop it opens a dialog; on mobile, a bottom sheet with the same choices. When a project deadline fit shows a missed goal, the deadline header SHALL show it as a button.

#### Scenario: From the scoped header on mobile

- **WHEN** the user taps Move goals… in a project's scoped Goals header below 768px
- **THEN** a bottom sheet opens with To the top, Before and After
