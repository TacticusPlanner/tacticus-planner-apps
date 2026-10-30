# Spec Delta

## ADDED Requirements

### Requirement: Owner can move a goal from its row menu

On the Goals page, on desktop and mobile, the "⋯" menu of every Active or Paused goal row SHALL offer Move to top, Move up and Move down whenever at least two goals can be reordered. The neighbours a move steps over SHALL be the in-flight goals among the rows the current status, Type and project filters show, in global priority order, regardless of Group. Move up SHALL give the goal the global position of the previous such goal, Move down that of the next, and Move to top that of the first, as one move resolved like a drop, so hidden goals keep their relative order. An item SHALL be shown only where it has a target, and Move to top SHALL not be shown where it would equal Move up. A move SHALL commit at once, without Save, and SHALL be announced with the goal's new position in a polite live region; the moved row SHALL be highlighted briefly.

#### Scenario: Move up in an ungrouped list

- **GIVEN** global order A, B, C, D, E and no filter
- **WHEN** the user chooses Move up in E's row menu
- **THEN** the saved global order is A, B, C, E, D and the page announces "Moved to priority 4 of 5."

#### Scenario: Move up crosses a group boundary

- **GIVEN** global order A, B, C, D, E, Group set to type, A, C and E in one group and B and D in another
- **WHEN** the user chooses Move up in E's row menu
- **THEN** E takes D's global position and stays in its own group, showing its new priority number

#### Scenario: Move up past hidden goals

- **GIVEN** global order A, B, C, D, E and a filter that shows only A, C and E
- **WHEN** the user chooses Move up in E's row menu
- **THEN** the saved global order is A, B, E, C, D

#### Scenario: Items at the ends

- **WHEN** the user opens the menu of the first goal among the shown in-flight goals
- **THEN** it offers Move down but neither Move up nor Move to top, and the last goal's menu offers no Move down

#### Scenario: Goals that hold no position

- **WHEN** the user opens the menu of a Completed goal, or the list holds fewer than two Active or Paused goals
- **THEN** the menu offers no move items
