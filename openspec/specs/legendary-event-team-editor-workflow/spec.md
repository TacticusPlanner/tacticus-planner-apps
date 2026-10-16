# legendary-event-team-editor-workflow Specification

## Purpose

Defines how a Legendary Event team is built quickly in the team editor: filtering and ranking the unit picker by objective, keeping the summary and Save in view, saving several teams in a row, and starting a team from a leaderboard row.

## Requirements

### Requirement: The picker filters and ranks units by objective

The team editor's picker SHALL show the lane's five objectives as multi-select chips (icon, label, score) above the unit grid, none selected by default. While one or more are selected, units that satisfy every selected objective SHALL come first, ordered by points per battle then name, and the other units SHALL follow dimmed; no unit is hidden by a chip. Each chip SHALL show how many selectable units satisfy it.

#### Scenario: Two objectives selected

- **GIVEN** the editor on Lysander Alpha where Dante satisfies Flying and No Resilient (152 points per battle) and another unit satisfies only Flying
- **WHEN** the user selects the Flying and No Resilient chips
- **THEN** Dante is listed before the Flying-only unit, which follows dimmed

#### Scenario: No chip selected

- **WHEN** the editor opens
- **THEN** the grid keeps today's order (points per battle, objectives count, name) and no tile is dimmed

#### Scenario: Chip counts follow Only unlocked

- **GIVEN** 14 units satisfy Flying and 3 of them are locked
- **WHEN** Only unlocked is on
- **THEN** the Flying chip reads 11 and the grid lists only the 11 owned units

### Requirement: The picker filter composes with the other picker controls

The objective chips SHALL work together with the search field, Only unlocked and the picker's Goals Preview switch: a unit is listed only when it passes the search and Only unlocked; the chips only reorder and dim. Selecting a dimmed unit SHALL be allowed and SHALL update the derived coverage as before. The chips' selection SHALL reset when the editor closes.

#### Scenario: Search with a chip

- **GIVEN** the Melee chip is selected and the search reads "cal"
- **WHEN** the grid renders
- **THEN** only units whose name contains "cal" are listed, those satisfying Melee first

#### Scenario: A dimmed unit can still be picked

- **GIVEN** the Melee chip is selected and a unit that does not satisfy Melee is dimmed
- **WHEN** the user picks it
- **THEN** it joins the team and the derived coverage drops Melee

#### Scenario: Selection resets

- **WHEN** the editor is closed and reopened
- **THEN** no chip is selected

### Requirement: The editor keeps its summary and actions in view

The editor SHALL keep a footer visible while the body scrolls, on the desktop dialog and the mobile sheet, showing the member count ("n/5 · at least 3" below three), the covered objectives as compact chips, the clear depth (the value, or the estimate marked "estimated") and the Cancel, Save and Save and add another actions. Unticking an objective and editing the depth stay in the body.

#### Scenario: Footer while scrolling the picker

- **GIVEN** the editor with four members and a long unit grid
- **WHEN** the user scrolls the grid to the bottom
- **THEN** the footer still shows "4/5", the covered objectives, the estimated depth and Save, with no scrolling needed to reach them

#### Scenario: Footer on mobile

- **WHEN** the editor opens below 768px
- **THEN** the same footer content sits above the safe area, the actions have touch targets of at least 44px and the sheet body scrolls underneath

### Requirement: Save and add another builds teams in a row

When creating a team the editor SHALL offer **Save and add another** beside Save. It saves the team, then clears the members, name and depth for a new team on the same lane while keeping the objective chips, Only unlocked, the search text and the Goals Preview switch, and puts focus on the search field; the team list updates behind the editor. It SHALL NOT be offered when editing a team, SHALL be unavailable whenever Save is, and after a failed save SHALL leave the draft as Save does.

#### Scenario: Two teams in a row

- **GIVEN** a valid three-member draft on Alpha with the Flying chip selected
- **WHEN** the user chooses Save and add another
- **THEN** the team is created, the editor stays open with no members, the Flying chip still selected and focus on the search field, and the Alpha list shows the new team

#### Scenario: Editing offers only Save

- **WHEN** the editor opens on an existing team
- **THEN** only Cancel and Save are offered

#### Scenario: Failed save keeps the draft

- **GIVEN** the plan was reloaded by another device
- **WHEN** the user chooses Save and add another
- **THEN** the draft stays, the editor says the save was not applied, and nothing is cleared

### Requirement: Leaderboard rows can start a team

A leaderboard row's actions menu SHALL carry **Add to new team** after Create goal. On a lane leaderboard it SHALL open the team editor for that lane with the unit as the first member. On the Overview leaderboard it SHALL list one item per lane that allows the unit ("Add to new team on Alpha"). The editor opens as for a suggestion (derived objectives ticked, default name) and nothing is saved until the user saves.

#### Scenario: Lane leaderboard

- **WHEN** the user opens Dante's row menu on the Alpha leaderboard and chooses Add to new team
- **THEN** the editor opens on Alpha with Dante as the first member and his objectives ticked

#### Scenario: Overview leaderboard

- **GIVEN** Dante is allowed on Alpha and Gamma but not on Beta
- **WHEN** the user opens his row menu on Overview
- **THEN** the menu lists "Add to new team on Alpha" and "Add to new team on Gamma", and no Beta item

#### Scenario: Locked unit

- **GIVEN** a locked unit
- **WHEN** the user chooses Add to new team
- **THEN** the editor opens with the unit as first member, shown with its locked styling

#### Scenario: The event page tour mentions it

- **WHEN** the event page tour runs
- **THEN** the lane leaderboard step's copy names Add to new team beside Create goal, localized in en, de, es and fr
