# project-goal-moves Specification

## Purpose

TBD - created by archiving change add-move-project-goals. Update Purpose after archive.

## Requirements

### Requirement: Move goals to top places a project's goals first as one block

**Move goals to top** SHALL move the project's in-flight goals (Active and Paused) to the top of the account-wide order as one block, in their current relative order, and keep every other goal's relative order. A goal that is also in other projects SHALL move with the block. Statuses SHALL NOT change. The move SHALL commit at once as one order update, with no confirmation, and be announced. The action SHALL be disabled when the block is already first.

#### Scenario: Order worked example

- **GIVEN** the in-flight order is A (Team Lavi), B (GW S29), C (Chaos Core), D (GW S29), E (Chaos Core), F (Team Lavi)
- **WHEN** the user moves Chaos Core's goals to the top
- **THEN** the saved order is C, E, A, B, D, F and the page announces "Moved 2 goals to priority 1."

#### Scenario: Paused goals move and stay paused

- **GIVEN** Chaos Core holds an Active goal and a Paused goal
- **WHEN** the user moves Chaos Core's goals to the top
- **THEN** both are first in the order and the Paused goal is still Paused

### Requirement: A project move can be undone

After a move, a toast SHALL offer **Undo** for 10 seconds. Undo SHALL restore the previous order only when the order has not changed since the move. Otherwise it SHALL show "The order changed since. Nothing was undone." and change nothing.

#### Scenario: Undo after a later reorder

- **GIVEN** the user moved Chaos Core's goals to the top and then dragged another goal
- **WHEN** they activate Undo on the toast
- **THEN** the order stays as it is and the toast reads "The order changed since. Nothing was undone."

### Requirement: Move goals to top is offered on the project's surfaces

**Move goals to top** SHALL be offered in the Projects row menu of every non-archived project with at least one in-flight goal, and in the scoped Goals header for that project, on desktop and mobile. When a project deadline fit shows a missed goal, the deadline header SHALL show it as a button.

#### Scenario: From the scoped header on mobile

- **WHEN** the user taps the Move goals to top button in a project's scoped Goals header below 768px
- **THEN** the project's goals move to the top and the Undo toast shows
