## Purpose

Shows the player's whole unit collection on the My Game Collection page: every catalog character and Machine of War, grouped by faction, with each owned unit's synced progression and each unowned unit's shard progress, so a player can see at a glance what they own and how far each unit is.

## ADDED Requirements

### Requirement: Collection lists every catalog unit in one list grouped by faction

The Collection page at `/my-game/collection` SHALL list every character and every Machine of War in the game catalog in one list, grouped by faction. Each faction group SHALL contain that faction's characters and Machines of War together. Faction groups SHALL be ordered by alliance in the game's canonical order (Imperial, Chaos, Xenos, then any other alliance), then by localized faction name. Within a group, owned units SHALL come before unowned units; owned units SHALL be ordered by progression (rarity and stars) descending, then rank descending, then localized name; unowned units SHALL be ordered nearest to unlock first (the larger share of the unlock cost already collected; units without an unlock cost after those with one), then by localized name. A unit SHALL appear exactly once. The page SHALL show a summary of how many catalog units are owned out of the total (for example "84 of 131 units owned"); while no roster is available the summary SHALL NOT be shown.

Assumption: a unit is owned exactly when it has a record in the synced `characters` or `mows` player data; the game API never returns a roster record for an unowned unit.

#### Scenario: Characters and Machines of War share their faction group

- **GIVEN** the player owns the Ultramarines characters Marneus Calgar and Titus and does not own the Ultramarines Machine of War
- **WHEN** they open `/my-game/collection`
- **THEN** one Ultramarines group lists Calgar and Titus (owned, ordered by progression then rank) followed by the greyed-out Machine of War

#### Scenario: Summary counts owned units

- **GIVEN** the catalog contains 131 characters and Machines of War and the player's roster contains 84 of them
- **WHEN** the page renders
- **THEN** the summary reads 84 of 131 units owned

#### Scenario: Group order

- **WHEN** the page renders
- **THEN** every Imperial faction group appears before every Chaos group, every Chaos group before every Xenos group, and groups within one alliance are ordered by their localized names

#### Scenario: Unowned units nearest to unlock come first

- **GIVEN** the player owns neither Calgar (75 of 400 shards) nor another Ultramarines character (300 of 400 shards)
- **WHEN** the page renders
- **THEN** the character with 300 of 400 shards is listed before Calgar

### Requirement: Collection lays factions out as an aligned full-width grid

The Collection page SHALL use the full width of the content area, with no maximum-width cap. Faction groups SHALL be cards of equal width in a responsive grid that adds columns as the window widens, with cards in the same row sharing one height. Each faction card SHALL have a header bar in that faction's colour showing the faction icon, the localized faction name and the faction's owned/total unit count (the count is omitted while no roster is available). Inside a card, units SHALL sit in fixed slots so that portraits line up across cards: seven slots per row on desktop (at least 768px) and five per row on mobile (below 768px). A faction with more units than one row holds SHALL wrap to further rows inside its card. Every faction header colour SHALL give at least 4.5:1 contrast with the header text.

Assumption: no faction in the current catalog has more than seven characters and Machines of War combined, so on desktop every faction fits one row.

#### Scenario: Desktop faction card

- **GIVEN** a desktop viewport and the player owns 4 of the 6 Blood Angels units
- **WHEN** the page renders
- **THEN** the Blood Angels card header shows the faction icon, "Blood Angels" and 4/6, and all six units sit on one row

#### Scenario: Mobile faction card

- **GIVEN** a mobile viewport
- **WHEN** a faction with seven units renders
- **THEN** its card shows five units on the first row and two on the second, and the page does not scroll horizontally at 420px

#### Scenario: Cards align

- **GIVEN** a desktop viewport wide enough for several faction columns
- **WHEN** the page renders
- **THEN** all faction cards have the same width and cards in the same row have the same height

### Requirement: An owned unit tile shows its synced progression

Each owned unit SHALL be shown as a tile with a round portrait ringed in its current rarity's colour, its stars over the top edge of the portrait, and one shard count inside a shard crystal at the portrait's lower right: its regular shards below the first blue star, and its mythic shards (in the mythic crystal) from the first blue star on, since every further ascension costs mythic shards. Below the portrait the tile SHALL show the unit's localized name on one line (truncated with an ellipsis when too long), then a row of number boxes, then an equipment row. An owned character's tile SHALL show its rank badge at the portrait's lower left, number boxes for active ability level, XP level and passive ability level in that order, with the XP level visually distinct from the ability levels, and its three equipment slots, each filled slot showing the item's icon framed in the item's rarity colour with the item level, and an empty slot shown as an empty outline. An owned Machine of War's tile SHALL show number boxes for its primary and secondary ability levels on the sides of the row and SHALL NOT show rank, XP level or equipment; it SHALL keep the same tile height as a character tile. Tiles SHALL NOT show power or Blackstone value. Text on a tile SHALL be at least 12px, except the shard count inside the crystal, which MAY be smaller because the tile's accessible name also carries it. Every tile SHALL expose an accessible name that spells out the unit's name and progression, with its images hidden from assistive technology. Tiles SHALL NOT be interactive in this capability: activating a tile navigates nowhere and opens nothing.

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

#### Scenario: Activating a tile does nothing

- **WHEN** the user clicks or taps Titus's tile
- **THEN** the route does not change and no dialog opens

#### Scenario: Accessible name spells out progression

- **WHEN** assistive technology reads Titus's tile
- **THEN** it announces one tile naming Titus with his rarity, stars, rank, XP level, ability levels and shards

### Requirement: An unowned unit tile is greyed out with its shard progress

A catalog unit that is not in the synced roster SHALL be shown with its portrait greyed out, a dashed neutral ring, a lock badge and its name in muted text, and SHALL NOT show stars, rank, the shard crystal, number boxes or equipment. An unowned character SHALL show the player's current shards for it out of the shards required to unlock it, together with a progress bar exposed as a progressbar to assistive technology. An unowned Machine of War SHALL show the player's current shard count alone, without a target or bar, because the catalog defines neither its initial rarity nor its unlock cost. Either kind SHALL show its mythic shards when the player has any. When the player's unowned-unit shard data is not available, the tile SHALL show no shard count rather than a count of zero. An unowned tile SHALL be as tall as an owned tile.

Assumptions:

- Shard and mythic-shard counts for an unowned unit come from the player's synced unowned-unit shard inventory; a unit missing from that inventory has 0 of each.
- The shards required to unlock a character come from the catalog's unlock shard cost for that character's initial rarity.
- The catalog carries no initial rarity or unlock shard cost for Machines of War.

#### Scenario: Unowned character with shards

- **GIVEN** the player does not own Calgar, has 75 Calgar shards, and the catalog unlock cost for Calgar's initial rarity is 400 shards
- **WHEN** the page renders
- **THEN** Calgar's tile is greyed out with a lock badge, shows 75 / 400 with a progress bar at about 19%, and shows no stars, rank, number boxes or equipment

#### Scenario: Unowned character with no shards

- **GIVEN** the shard inventory is synced and has no entry for an unowned character whose unlock cost is 400
- **WHEN** the page renders
- **THEN** that character's tile shows 0 / 400 with an empty progress bar

#### Scenario: Unowned Machine of War

- **GIVEN** the player does not own a Machine of War and has 30 of its shards
- **WHEN** the page renders
- **THEN** its tile is greyed out with a lock badge and shows 30 shards with no unlock target or bar

### Requirement: Without a roster every unit is shown greyed out with a prompt

A synced roster is available only once both the characters and the Machines of War data have synced; while either is missing the page SHALL treat the roster as not synced. When no synced roster is available, the page SHALL still list every catalog unit grouped and ordered as for unowned units, all greyed out with no shard counts, together with a prompt explaining why. In place of shard progress, a character's tile SHALL show the rarity it starts at (for example "Starts Epic"); a Machine of War's tile SHALL show nothing there. For an anonymous user the prompt SHALL invite them to sign in. For a signed-in user whose roster has not been synced yet, the prompt SHALL invite them to sync with Tacticus and offer the existing Sync with Tacticus action. Once a sync delivers the roster, the page SHALL show owned and unowned tiles without a reload.

#### Scenario: Anonymous user

- **GIVEN** the user is not signed in
- **WHEN** they open `/my-game/collection`
- **THEN** every catalog unit is listed greyed out by faction, characters show their starting rarity, no owned summary or faction owned counts are shown, and a prompt invites them to sign in

#### Scenario: Signed in but not synced

- **GIVEN** the user is signed in and their roster has not been synced
- **WHEN** they open the page
- **THEN** every unit is listed greyed out and a prompt invites them to sync with Tacticus, offering the Sync with Tacticus action

#### Scenario: Only part of the roster has synced

- **GIVEN** a signed-in user whose characters data has synced but whose Machines of War data has not
- **WHEN** they open the page
- **THEN** every unit is listed greyed out with the sync prompt, and no owned summary is shown

#### Scenario: Sync completes while the page is open

- **GIVEN** a signed-in user is on the page without a synced roster
- **WHEN** a sync with Tacticus completes and delivers their roster
- **THEN** the prompt disappears and the page shows their owned units and greyed-out unowned units without a page reload

### Requirement: Collection distinguishes loading and load failure

While the game catalog is loading, the page SHALL show placeholder faction cards (skeletons that do not animate when the user prefers reduced motion), marked busy for assistive technology, and SHALL NOT show the no-roster prompt or any unit tile. If the game catalog fails to load, the page SHALL show an error with a retry action instead of an empty list. If the catalog loads but the player's roster fails to load for a signed-in user, the page SHALL show the catalog greyed out as in the no-roster state, with an error message and retry instead of the sync prompt.

#### Scenario: Catalog loading

- **WHEN** the page opens before the game catalog is available
- **THEN** placeholder faction cards are shown, marked busy, and no unit tiles or prompts are shown

#### Scenario: Catalog failure

- **GIVEN** the game catalog fails to load
- **WHEN** the page renders
- **THEN** an error with a retry action is shown and no empty list is presented as if the catalog had no units

#### Scenario: Roster read failure

- **GIVEN** a signed-in user, the catalog loads, and reading their roster fails
- **WHEN** the page renders
- **THEN** every unit is shown greyed out with an error message and a retry action, not the sync prompt

### Requirement: Collection has a page tour

The Collection page SHALL register a page tour, startable from the page's tour control, that explains the faction groups, an owned tile's progression indicators, and greyed-out unowned units, on both desktop and mobile. Tour steps SHALL target elements that exist in the rendered layout of each form; a step whose element is absent (the summary without a roster, an owned tile when the player owns no unit, an unowned tile when they own every unit) SHALL be left out.

#### Scenario: Desktop tour

- **GIVEN** a desktop viewport
- **WHEN** the user starts the page tour
- **THEN** each step highlights an element visible on the desktop layout

#### Scenario: Mobile tour

- **GIVEN** a mobile viewport
- **WHEN** the user starts the page tour
- **THEN** each step highlights an element visible on the mobile layout
