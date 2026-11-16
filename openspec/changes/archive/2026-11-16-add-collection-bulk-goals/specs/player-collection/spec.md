## ADDED Requirements

### Requirement: Collection has a select mode for creating goals

Collection SHALL show a **Select units** toggle beside the summary line when the player is signed in, the roster is available and Compare is off, at every width. Turning it on SHALL enter select mode:

- every listed tile (Cards) and row (Roster, including the mobile expandable rows) SHALL show a checkbox, and activating the tile or row SHALL toggle its selection instead of opening the unit page;
- each selectable item SHALL be a checkbox with an accessible name naming the unit and its checked state;
- a bar pinned to the bottom of the viewport SHALL show the number of selected units, **Select all shown** (adds every listed unit), **Clear**, **Create goals** (disabled with nothing selected) and **Done**.

The selection SHALL survive search, sort, filter, quick filter, grouping and view changes, and SHALL count units no longer listed. Done, turning Compare on, or leaving the page SHALL end select mode and discard the selection. After the dialog creates every unit's goals, select mode SHALL end.

#### Scenario: Selecting ready-to-rank-up units

- **GIVEN** a signed-in, synced player on Collection
- **WHEN** they turn on Select units, apply the Ready to rank up quick filter and press Select all shown
- **THEN** every listed unit is checked and the bar reads "N selected" for that count

#### Scenario: A tile toggles instead of navigating

- **GIVEN** select mode is on
- **WHEN** the player activates a tile
- **THEN** the tile is checked and the page stays on Collection

#### Scenario: Selection survives a filter change

- **GIVEN** two units are selected
- **WHEN** the player changes the faction filter so neither is listed
- **THEN** the bar still reads "2 selected"

#### Scenario: Not available without a roster

- **WHEN** a signed-out visitor, or a signed-in player without a synced roster, opens Collection
- **THEN** no Select units toggle is shown
