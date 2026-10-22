## MODIFIED Requirements

### Requirement: Unit navigation follows where the user came from

The unit page SHALL show a navigation bar with a back button, a breadcrumb
`Library / Characters / <name>`, Previous and Next buttons, the unit's position, and the page tour
button. Back, prev/next and the position SHALL follow the page the user came from: the characters
list (its current order and search) by default, or the Collection page when the unit was opened from a
Collection tile. Opened from Collection, the back button SHALL be labelled "Collection" (its accessible
name "Back to Collection") and return to `/my-game/collection`, and prev/next and the position SHALL
walk only the characters, in the order Collection showed them; Machines of War SHALL NOT be stepped
onto. The origin SHALL survive reload and history back/forward and SHALL carry over when the user
steps with Previous or Next. Prev/next SHALL keep the active tab and drop every other query parameter,
so the Rank-up materials range doesn't carry over to another unit. The first unit SHALL have Previous
disabled and the last unit Next disabled. The breadcrumb SHALL stay `Library / Characters / <name>`
whatever the origin.

#### Scenario: Prev/next from the list

- **GIVEN** the visitor opened Tigurius from the unfiltered characters list
- **WHEN** they activate Next
- **THEN** the page shows the character after Tigurius in the list's order, the position text reads
  "<n> of <total>", and the URL's `tab` parameter is unchanged

#### Scenario: Opened from Collection

- **GIVEN** the player's Collection shows 120 characters and 11 Machines of War, and Titus is the 5th
  character in Collection order
- **WHEN** they open Titus from his Collection tile
- **THEN** the back button reads "Collection", the position reads "5 of 120", and Next opens the 6th
  character in Collection order, never a Machine of War

#### Scenario: Back to Collection

- **GIVEN** a character page opened from Collection, after stepping Next twice
- **WHEN** the user activates the back button
- **THEN** the browser navigates to `/my-game/collection`

#### Scenario: Back button on mobile

- **GIVEN** a mobile viewport and a character page opened from Collection
- **WHEN** a screen reader user focuses the icon-only back button
- **THEN** its accessible name is "Back to Collection"

#### Scenario: Opened directly from a link

- **WHEN** a visitor opens a unit page from a bookmark or shared link
- **THEN** back returns to the characters list and prev/next follow the list's default order

#### Scenario: Accessible prev/next

- **WHEN** a screen reader user focuses Next
- **THEN** its accessible name is "Next unit: <name of the next character>"
