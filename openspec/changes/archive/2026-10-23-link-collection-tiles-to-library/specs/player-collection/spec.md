## MODIFIED Requirements

### Requirement: Collection has a page tour

The Collection page SHALL register a page tour, startable from the page's tour control, that explains the faction groups, an owned tile's progression indicators, greyed-out unowned units, and that selecting a tile opens that unit's Library page, on both desktop and mobile. Tour steps SHALL target elements that exist in the rendered layout of each form; a step whose element is absent (the summary without a roster, an owned tile when the player owns no unit, an unowned tile when they own every unit) SHALL be left out. Whichever tile steps remain SHALL still tell the player that a tile opens its Library page.

#### Scenario: Desktop tour

- **GIVEN** a desktop viewport
- **WHEN** the user starts the page tour
- **THEN** each step highlights an element visible on the desktop layout, and a tile step says that a tile opens the unit's Library page

#### Scenario: Mobile tour

- **GIVEN** a mobile viewport
- **WHEN** the user starts the page tour
- **THEN** each step highlights an element visible on the mobile layout, and a tile step says that a tile opens the unit's Library page

#### Scenario: Tour without owned units

- **GIVEN** the user is signed out, so every tile is greyed out and the owned-tile step is left out
- **WHEN** they start the page tour
- **THEN** the unowned-tile step still says that selecting a tile opens the unit's Library page

## ADDED Requirements

### Requirement: An owned unit tile shows its progression at a glance

Each owned unit SHALL be shown as a tile with a round portrait ringed in its current rarity's colour, its stars over the top edge of the portrait, and one shard count inside a shard crystal at the portrait's lower right: its regular shards below the first blue star, and its mythic shards (in the mythic crystal) from the first blue star on, since every further ascension costs mythic shards. Below the portrait the tile SHALL show the unit's localized name on one line (truncated with an ellipsis when too long), then a row of number boxes, then an equipment row. An owned character's tile SHALL show its rank badge at the portrait's lower left, number boxes for active ability level, XP level and passive ability level in that order, with the XP level visually distinct from the ability levels, and its three equipment slots, each filled slot showing the item's icon framed in the item's rarity colour with the item level, and an empty slot shown as an empty outline. An owned Machine of War's tile SHALL show number boxes for its primary and secondary ability levels on the sides of the row and SHALL NOT show rank, XP level or equipment; it SHALL keep the same tile height as a character tile. Tiles SHALL NOT show power or Blackstone value. Text on a tile SHALL be at least 12px, except the shard count inside the crystal, which MAY be smaller because the tile's accessible name also carries it. Every tile SHALL expose an accessible name that spells out the unit's name and progression, with its images hidden from assistive technology.

#### Scenario: Owned character tile

- **GIVEN** the synced roster has Titus at Legendary with four red stars, rank Gold 1, XP level 45, active ability 40, passive ability 38, three equipped items, 120 shards and 4 mythic shards
- **WHEN** the Collection page renders
- **THEN** Titus's tile shows a Legendary ring with four red stars, the Gold 1 rank badge, 120 in the shard crystal and no mythic count, the name Titus, number boxes 40, 45 and 38 (abilities either side of the XP level, as in game), and the three equipped items with their levels, and shows no power value

#### Scenario: Blue-star unit shows mythic shards only

- **GIVEN** the synced roster has a unit at Legendary with one blue star, 300 shards and 12 mythic shards
- **WHEN** the page renders
- **THEN** its tile shows 12 in the mythic shard crystal and does not show the 300 regular shards

#### Scenario: Owned Machine of War tile

- **GIVEN** the synced roster has a Machine of War with primary ability 30 and secondary ability 25
- **WHEN** the page renders
- **THEN** its tile shows its rarity ring and stars, number boxes 30 and 25, and its shards, shows no rank, XP level or equipment, and is as tall as the character tiles next to it

#### Scenario: Accessible name spells out progression

- **WHEN** assistive technology reads Titus's tile
- **THEN** it announces one tile naming Titus with his rarity, stars, rank, XP level, ability levels and shards

### Requirement: Collection tiles open the unit's Library page

Every tile on the Collection page SHALL be a link to its unit's Library page: `/library/characters/<id>` for a character and `/library/machines-of-war/<id>` for a Machine of War, where `<id>` is the unit's catalog id. This SHALL hold for owned tiles, unowned tiles, and the greyed-out tiles shown while no roster is available (signed out, not synced, or roster read failure). The whole tile SHALL be the click and tap target, the full width of its slot. The link SHALL keep the tile's spelled-out accessible name and expose no other name, SHALL be reachable with the keyboard in DOM order (faction by faction, left to right) and activated with Enter, and SHALL show a visible focus indicator. Hovering a tile on a pointer device SHALL give visible feedback. Activating a tile SHALL open the unit page in the same tab, as a normal link that can also be opened in a new tab.

The opened page SHALL know it was opened from Collection (see the `character-unit-details` and `mow-unit-details` navigation requirements). That origin SHALL carry, for the opened unit's kind only, the units of that kind in the order Collection showed them (faction group by faction group, then the order within each group), and SHALL NOT appear in the URL.

#### Scenario: Opening an owned character

- **GIVEN** a signed-in player whose synced roster has Titus
- **WHEN** they click or tap Titus's tile
- **THEN** the browser navigates to `/library/characters/<Titus's id>` and the page shows Titus with the player's own progression

#### Scenario: Opening a Machine of War

- **WHEN** the user activates a Machine of War's tile, owned or not
- **THEN** the browser navigates to `/library/machines-of-war/<its id>`

#### Scenario: Opening an unowned unit

- **GIVEN** the player does not own Calgar
- **WHEN** they activate Calgar's greyed-out tile
- **THEN** the browser navigates to Calgar's Library page, which shows catalog values because the player has no Calgar

#### Scenario: Signed out

- **GIVEN** the user is not signed in and every tile is greyed out
- **WHEN** they activate a character's tile
- **THEN** the browser navigates to that character's Library page, which shows catalog data only

#### Scenario: Keyboard

- **WHEN** a keyboard user tabs through the page
- **THEN** focus moves through the tiles in DOM order with a visible focus indicator, each focused tile is announced as a link with the tile's spelled-out accessible name, and Enter opens its Library page

#### Scenario: Open in a new tab

- **WHEN** the user middle-clicks a tile or opens it with the browser's "open in new tab"
- **THEN** the unit's Library page opens in a new tab, and that page behaves as if opened from a link (back returns to its Library list)

## REMOVED Requirements

### Requirement: An owned unit tile shows its synced progression

**Reason**: It also required tiles to be non-interactive ("Activating a tile does nothing"), which this
change reverses. Its tile content is carried unchanged by "An owned unit tile shows its progression at
a glance", and the new behavior by "Collection tiles open the unit's Library page".

**Migration**: None for users. Tests asserting that activating a tile changes nothing are replaced by
tests that it opens the unit's Library page.
