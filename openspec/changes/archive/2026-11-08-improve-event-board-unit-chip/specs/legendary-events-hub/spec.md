## MODIFIED Requirements

### Requirement: The Teams tab shows an Event board of the shown lanes

The Teams tab SHALL show, after the lane selection, an Event board laid out like V1's Teams tab: one column per shown lane in lane order, side by side at or above 1024px and stacked below. Each column SHALL show its name with its allowed-units rule and its overview figures (see "Lane overview section"), a unit table, then the lane's Teams section with its team cards, Add team and Suggest teams (see `legendary-event-teams`), so a lane's teams are edited in place. The unit table SHALL have one column per objective in objective order, headed by its icon, label, points and "cleared / battles" from synced progress (omitted while progress is unavailable), listing every unit the lane allows that satisfies it: owned units first by power, strongest first, then units the player does not own, marked "Locked"; a dashed line SHALL follow the fifth unit. Pressing objective headings SHALL select them: the selected objectives merge into one leading column listing the units that satisfy all of them, until the selection is cleared. Every unit SHALL show as a unit chip (see the unit chip requirement), in the unit table and on the team cards alike; no chip SHALL show stars, which appear only in the unit details. Once teams have loaded, an objective no saved team covers SHALL be marked "No team". Activating a unit SHALL open the page's team editor on a new team starting with that unit and the column's objectives; a unit SHALL show a "+" on hover and keyboard focus to say so. Each column SHALL list its best seven units (the dashed team line still under the fifth), with a "Show all units" control listing the rest, on every screen size. On a phone (below 768px) the unit table SHALL NOT scroll vertically inside the page. The unit table scrolls in both directions inside its box; its heading row SHALL stay at the top and span every column, moving sideways with the columns when they are wider than the box.

Under the board the tab SHALL show one **Eligibility leaderboard** (specified in `legendary-event-eligibility`): the cross-lane leaderboard over the shown lanes when two or three are shown, and the lane's own leaderboard (with its objective icons and estimated clears) when one is.

#### Scenario: Board shows the shown lanes

- **GIVEN** Alpha and Beta each have one saved team and all three lanes are shown
- **WHEN** the user opens the Teams tab
- **THEN** the Event board shows three lane columns with their figures and objectives, one team card in Alpha and in Beta, Gamma's empty state, and the cross-lane leaderboard under the board

#### Scenario: Uncovered objective

- **GIVEN** no saved Alpha team covers Alpha's second objective
- **WHEN** the Event board renders
- **THEN** that objective is marked "No team"

#### Scenario: Objective selection

- **GIVEN** the user presses Alpha's first and second objective headings
- **WHEN** the table renders
- **THEN** its first column lists only the units satisfying both, and Clear selection restores one column per objective

#### Scenario: One lane shown

- **GIVEN** the user switches Alpha and Gamma off
- **WHEN** the Teams tab renders, now or after a reload
- **THEN** only Beta's column shows, the leaderboard is Beta's own, and Beta's switch cannot be turned off

#### Scenario: Stars only in the details

- **GIVEN** the user owns `templHelbrecht` at Legendary with 4 red stars, and a saved Alpha team includes him
- **WHEN** the Event board renders
- **THEN** neither his chip on the team card nor his chip in Alpha's unit table shows stars, and his details show four red stars

## ADDED Requirements

### Requirement: A unit chip shows a unit's name, ascension, rank and abilities

A unit chip on the event page SHALL show:

- **The unit's display name** (the localized name the rest of the app shows, e.g. "Helbrecht"), on one line, cut with an ellipsis when it doesn't fit and never wrapped.
  - **Beside the portrait** (a row, with the ability levels side by side under the name) or **across the top**, above the portrait. Every chip in one place SHALL use the same layout:
    - **The unit table:** across the top while its columns are narrower than 8.5rem, and beside the portrait from 8.5rem. The width follows the screen and the number of shown lanes.
    - **Team cards and token cards:** beside the portrait, with the ability levels side by side.
    - **The team picker:** shows no name on the chip.
- **The portrait.**
- For an owned unit:
  - **a rarity badge** on the portrait: the game's lettered rarity hexagon (C, U, R, E, L or M for Common to Mythic, from the unit's current ascension), the same art the app shows for rarity elsewhere;
  - its **rank icon**;
  - its **active and passive ability levels** ("A{n}" and "P{n}": side by side in a row, one over the other when the name is on top).
- The rarity SHALL NOT be shown by a coloured ring, and the chip SHALL NOT show stars.

States:

- **Locked unit** (the player doesn't own it): muted name, greyed portrait, "Locked" instead of rank and abilities, no badge, no rank shading.
- **Ownership unknown** (no roster: signed out or not synced): the name and portrait only.

The chip's accessible name SHALL spell out the unit's long name (see the details requirement), its rarity, its rank and its ability levels. For a locked unit it SHALL be the name and "not unlocked", as today.

#### Scenario: Owned unit chip

- **GIVEN** the user owns `templHelbrecht` at Legendary with 4 red stars, rank Diamond 1, active 8 and passive 8
- **WHEN** his chip renders in English
- **THEN** it shows "Helbrecht", his portrait with an "L" badge, the Diamond 1 rank icon and "A8" and "P8"
- **AND** its accessible name reads "High Marshal Helbrecht, Legendary, Diamond I, Active ability level 8, passive ability level 8"

#### Scenario: Long name is cut, not wrapped

- **GIVEN** the language is German and the chip is for the unit whose display name is "Der Schöpfungsvater" (19 characters)
- **WHEN** it renders in a 5.9rem table column
- **THEN** the name shows on one line ending in an ellipsis, and the chip's height matches the other chips in the column

#### Scenario: Name beside the portrait when it fits

- **GIVEN** the user owns `templHelbrecht`, and only Alpha is shown, so the unit table's columns are wider than 8.5rem
- **WHEN** his chip renders in the unit table
- **THEN** "Helbrecht" sits beside his portrait and rank icon, with "A8" and "P8" side by side under it, in a single row

#### Scenario: Name on top in narrow columns

- **GIVEN** all three lanes are shown on a 1920px screen, so the unit table's columns are narrower than 8.5rem
- **WHEN** `templHelbrecht`'s chip renders in the unit table
- **THEN** "Helbrecht" sits across the top, above his portrait, rank icon and the stacked "A8" over "P8", like every other chip in the table

#### Scenario: Locked unit chip

- **GIVEN** the user doesn't own `templAncient`
- **WHEN** his chip renders in a unit table
- **THEN** it shows "Thoread" muted, a greyed portrait and "Locked", with no badge, rank icon, ability levels or rank shading

#### Scenario: No roster

- **GIVEN** the user isn't signed in
- **WHEN** the Event board renders
- **THEN** every chip shows only the unit's name and portrait

### Requirement: A unit chip offers the unit's details

A unit chip SHALL offer a details panel. It SHALL replace the native title tooltip and contain:

- **The unit's long name:** the first of the unit's other names in the current language when it has one that differs from the display name; otherwise the display name.
- **Its rarity:** letter badge, rarity name and its stars (or mythic wings).
- **Its rank name.**
- **Its ability levels**, in words ("Active 8 · Passive 8").

A locked unit's details SHALL show the long name and "Not owned". With no roster they SHALL show the long name only.

Opening the details:

- **With a mouse:** on hover after a short delay; hidden on leave.
- **With the keyboard:** on focus, where the chip can take focus. A unit-table chip is a button that starts a team. A Teams card member chip SHALL be a button that opens the details panel on click or Enter. Chips inside another control (a picker tile) or a popover (token cards) SHALL NOT be separate tab stops; there, keyboard users rely on the chip's accessible name.
- **Moving through a unit table:** each lane's unit table SHALL be a single Tab stop (the last focused unit, at first the top of the first column). The arrow keys SHALL move between units (up and down within a column, left and right to the next column with units), and Home and End to a column's first and last unit. The table SHALL describe this to assistive technology ("Use the arrow keys to move between units.").
- **Focus ring:** a focused chip SHALL show the full-strength focus ring, at least 3:1 against the card.
- **On touch:** a long-press of about half a second SHALL open the same details as a panel that a tap outside closes. A normal tap SHALL keep the chip's own action (unit table: start a team; team card: open the details), and a long-press SHALL NOT also trigger that action.

#### Scenario: Hover shows details

- **GIVEN** the user owns `templHelbrecht` at Legendary with 4 red stars, rank Diamond 1, active 8 and passive 8
- **WHEN** the user hovers his chip with a mouse
- **THEN** the details show "High Marshal Helbrecht", the "L" badge with "Legendary" and four red stars, "Diamond I", and "Active 8 · Passive 8"

#### Scenario: Details fall back to the display name

- **GIVEN** a unit with no other name in the current language
- **WHEN** its details open
- **THEN** they show its display name as the long name

#### Scenario: Keyboard focus on a table chip

- **WHEN** a keyboard user tabs to a unit-table chip
- **THEN** its details show, and Enter starts a team with that unit as before

#### Scenario: One Tab stop per unit table

- **GIVEN** the board shows three lanes with their unit tables
- **WHEN** a keyboard user presses Tab from the lane selection
- **THEN** each lane's unit table takes one Tab stop, not one per unit
- **AND** the arrow keys move focus between that table's units, and Tab leaves the table

#### Scenario: Team card member details from the keyboard

- **WHEN** a keyboard user focuses a member chip on a Teams card and presses Enter
- **THEN** the member's details panel opens

#### Scenario: Long-press on touch

- **GIVEN** a touch device
- **WHEN** the user long-presses a unit-table chip
- **THEN** the details panel opens, the team editor doesn't open, and a tap outside closes the panel

#### Scenario: Normal tap on touch

- **GIVEN** a touch device
- **WHEN** the user taps a unit-table chip
- **THEN** the team editor opens on a new team starting with that unit, and no details panel opens

#### Scenario: Locked unit details

- **GIVEN** the user doesn't own `templAncient`
- **WHEN** his chip's details open
- **THEN** they show "Ancient Thoread" and "Not owned", and no rarity, rank or ability levels

### Requirement: Rank shading on unit chips is a per-browser setting

Owned unit chips SHALL be tinted in their rank colour when **Rank shading** is on, and SHALL use the plain card background and border when it is off. The Event board header SHALL carry a "Rank shading" switch.

The setting:

- SHALL default to on;
- SHALL be remembered per browser (not synced to the account), like the lane switches;
- SHALL apply to every unit chip on the event page: the Event board's unit tables and team cards, the team picker and the token cards;
- SHALL persist across tab changes and reloads.

Text and icons on a tinted chip SHALL keep at least 4.5:1 contrast in light and dark themes.

#### Scenario: Shading turned off

- **GIVEN** Rank shading is on
- **WHEN** the user switches it off
- **THEN** no chip in the unit tables or on the team cards is tinted, and the board still shows it off after a reload

#### Scenario: Default

- **GIVEN** a browser that has never changed the setting
- **WHEN** the Event board renders
- **THEN** Rank shading is on and owned chips are tinted in their rank colour
