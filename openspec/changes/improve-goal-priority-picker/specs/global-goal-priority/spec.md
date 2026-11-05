# Spec Delta

## MODIFIED Requirements

### Requirement: Owner can move a goal to a typed priority from its row menu

On the Goals page, on desktop and mobile, the "⋯" menu of every Active or Paused goal row SHALL offer Move to priority… whenever at least two goals hold a global position, even when the filters show only that goal. It SHALL open a small dialog with the priority picker (`goal-priority-picker`), listing positions 1 to the number of in-flight goals, each naming the goal at that position, and preselected to the goal's current priority. Move SHALL be enabled only when a position other than the current one is chosen, and SHALL give the goal the global position the goal at that priority holds, as one move resolved like the other row-menu moves (committed at once, announced, highlighted). The positions SHALL count goals the filters hide.

#### Scenario: Move to a typed priority

- **GIVEN** global order A, B, C, D, E
- **WHEN** the user chooses Move to priority… in E's row menu, types 2 and picks "2 · B"
- **THEN** the saved global order is A, E, B, C, D and the page announces "Moved to priority 2 of 5."

#### Scenario: Out-of-range or unchanged value

- **WHEN** the picker holds the goal's current priority, or the search holds 0, a number above the in-flight count, or a fraction
- **THEN** no new position is chosen and Move is disabled
