## MODIFIED Requirements

### Requirement: MoW unit navigation follows where the user came from

The MoW unit page SHALL show the same navigation bar as the character unit page, with the breadcrumb
`Library / Machines of War / <name>`. Back, Previous, Next and the position ("<n> of <total>") SHALL
follow the page the user came from: the Machines of War list (its current order and search) by default,
or the Collection page when the MoW was opened from a Collection tile. Opened from Collection, the back
button SHALL be labelled "Collection" (its accessible name "Back to Collection") and return to
`/my-game/collection`, and prev/next and the position SHALL walk only the Machines of War, in the order
Collection showed them; characters SHALL NOT be stepped onto. The origin SHALL survive reload and
history back/forward and SHALL carry over when the user steps with Previous or Next. Prev/next SHALL
keep the active tab. The first MoW SHALL have Previous disabled and the last Next disabled. The
breadcrumb SHALL stay `Library / Machines of War / <name>` whatever the origin.

#### Scenario: Prev/next from the list

- **GIVEN** the visitor opened Galatian from the unfiltered Machines of War list
- **WHEN** they activate Next on the Ability upgrades tab
- **THEN** the page shows the MoW after Galatian in the list's order with Ability upgrades still selected

#### Scenario: Opened from Collection

- **GIVEN** the player's Collection shows 11 Machines of War and Galatian is the 3rd of them in
  Collection order
- **WHEN** they open Galatian from its Collection tile
- **THEN** the back button reads "Collection" and returns to `/my-game/collection`, the position reads
  "3 of 11", and Next opens the 4th Machine of War in Collection order, never a character

#### Scenario: Opened directly from a link

- **WHEN** a visitor opens a MoW unit page from a bookmark or shared link
- **THEN** back returns to the Machines of War list and prev/next follow the list's default order
