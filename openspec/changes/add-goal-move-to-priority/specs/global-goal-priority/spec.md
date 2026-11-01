# Spec Delta

## ADDED Requirements

### Requirement: Owner can move a goal to a typed priority from its row menu

On the Goals page, on desktop and mobile, the "⋯" menu of every Active or Paused goal row SHALL offer Move to priority… whenever at least two goals hold a global position, even when the filters show only that goal. It SHALL open a small dialog with one number field labelled with the allowed range (1 to the number of in-flight goals) and prefilled with the goal's current priority. Move SHALL be enabled only for a whole number in range that differs from the current priority, and SHALL give the goal the global position the goal at that priority holds, as one move resolved like the other row-menu moves (committed at once, announced, highlighted). The number SHALL count goals the filters hide.

#### Scenario: Move to a typed priority

- **GIVEN** global order A, B, C, D, E
- **WHEN** the user chooses Move to priority… in E's row menu and enters 2
- **THEN** the saved global order is A, E, B, C, D and the page announces "Moved to priority 2 of 5."

#### Scenario: Out-of-range or unchanged value

- **WHEN** the field holds the goal's current priority, 0, a number above the in-flight count, or a fraction
- **THEN** Move is disabled

### Requirement: Menu items are never clipped

Dropdown menu items SHALL show their full text; a menu SHALL be at least as wide as its content, its trigger and 8rem, within the available viewport width.

#### Scenario: Long project removal label

- **WHEN** the user opens a goal's "⋯" menu while the page is scoped to a project
- **THEN** "Remove from this project" is shown in full
