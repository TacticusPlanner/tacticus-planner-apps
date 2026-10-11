## Purpose

Shows the player's whole unit collection on the My Game Collection page: every catalog character and Machine of War, grouped by faction, with each owned unit's synced progression and each unowned unit's shard progress, so a player can see at a glance what they own and how far each unit is.

## ADDED Requirements

### Requirement: Collection lists every catalog unit in one list grouped by faction

The Collection page at `/my-game/collection` SHALL list every character and every Machine of War in the game catalog in one list, grouped by faction. Each faction group SHALL have a header showing the faction's icon and localized name, and SHALL contain that faction's characters and Machines of War together. Faction groups SHALL be ordered by alliance (Imperial, Xenos, Chaos), then by localized faction name. Within a group, owned units SHALL come before unowned units; owned units SHALL be ordered by progression (rarity and stars) descending, then rank descending, then localized name; unowned units SHALL be ordered by localized name. A unit SHALL appear exactly once. The page SHALL show a summary of how many catalog units are owned out of the total (for example "84 of 131 units owned"); while no roster is available the summary SHALL NOT be shown.

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
- **THEN** every Imperial faction group appears before every Xenos group, every Xenos group before every Chaos group, and groups within one alliance are ordered by their localized names

### Requirement: An owned unit tile shows its synced progression

Each owned unit SHALL be shown as a tile with its portrait, a frame matching its current rarity, and its stars. An owned character's tile SHALL additionally show its rank, XP level, active and passive ability levels, equipped items, shards and mythic shards. An owned Machine of War's tile SHALL show its primary and secondary ability levels, shards and mythic shards, and SHALL NOT show rank, XP level or equipment. Tiles SHALL NOT show power or Blackstone value. Every tile SHALL expose the unit's localized name as its accessible name and, on desktop, as a tooltip on hover or keyboard focus. Tiles SHALL NOT be interactive beyond the tooltip in this capability: activating a tile navigates nowhere and opens nothing.

#### Scenario: Owned character tile

- **GIVEN** the synced roster has Titus at Legendary 2 stars, rank Gold 1, XP level 45, active ability 40, passive ability 38, three equipped items, 120 shards and 4 mythic shards
- **WHEN** the Collection page renders
- **THEN** Titus's tile shows a Legendary frame with 2 stars, the Gold 1 rank, XP level 45, ability levels 40 and 38, the three equipped items, 120 shards and 4 mythic shards, and shows no power value

#### Scenario: Owned Machine of War tile

- **GIVEN** the synced roster has a Machine of War with primary ability 30 and secondary ability 25
- **WHEN** the page renders
- **THEN** its tile shows its rarity frame and stars, ability levels 30 and 25, and its shards, and shows no rank, XP level or equipment

#### Scenario: Activating a tile does nothing

- **WHEN** the user clicks or taps an owned unit's tile
- **THEN** the route does not change and no dialog opens

#### Scenario: Desktop tooltip names the unit

- **GIVEN** a desktop viewport (at least 768px)
- **WHEN** the user hovers over or keyboard-focuses a tile
- **THEN** a tooltip shows the unit's localized name

#### Scenario: Mobile has no hover tooltip

- **GIVEN** a mobile viewport (below 768px)
- **WHEN** the user taps a tile
- **THEN** no tooltip opens and the tile still exposes the unit's localized name to assistive technology

### Requirement: An unowned unit tile is greyed out with its shard progress

A catalog unit that is not in the synced roster SHALL be shown greyed out with its portrait. An unowned character SHALL have a frame matching its catalog initial rarity and SHALL show the player's current shards for it out of the shards required to unlock it. An unowned Machine of War SHALL have a neutral frame and SHALL show the player's current shard count alone, because the catalog defines neither its initial rarity nor its unlock cost. Either kind SHALL show its mythic shards when the player has any, and SHALL NOT show stars, rank, XP level, abilities or equipment. When the player's unowned-unit shard data is not available, the tile SHALL show the unit greyed out without a shard count rather than a count of zero.

Assumptions:

- Shard and mythic-shard counts for an unowned unit come from the player's synced unowned-unit shard inventory; a unit missing from that inventory has 0 of each.
- The shards required to unlock a character come from the catalog's unlock shard cost for that character's initial rarity.
- The catalog carries no initial rarity or unlock shard cost for Machines of War.

#### Scenario: Unowned character with shards

- **GIVEN** the player does not own Calgar, has 75 Calgar shards, and the catalog unlock cost for Calgar's initial rarity is 400 shards
- **WHEN** the page renders
- **THEN** Calgar's tile is greyed out, has the frame of his initial rarity, shows 75 / 400 shards, and shows no stars, rank, XP level, abilities or equipment

#### Scenario: Unowned character with no shards

- **GIVEN** the shard inventory is synced and has no entry for an unowned character whose unlock cost is 400
- **WHEN** the page renders
- **THEN** that character's tile shows 0 / 400 shards

#### Scenario: Unowned Machine of War

- **GIVEN** the player does not own a Machine of War and has 30 of its shards
- **WHEN** the page renders
- **THEN** its tile is greyed out with a neutral frame and shows 30 shards with no unlock target

### Requirement: Without a roster every unit is shown greyed out with a prompt

When no synced roster is available, the page SHALL still list every catalog unit grouped and ordered as for unowned units, all greyed out with no shard counts, together with a prompt explaining why. For an anonymous user the prompt SHALL invite them to sign in. For a signed-in user whose roster has not been synced yet, the prompt SHALL invite them to sync with Tacticus and offer the existing Sync with Tacticus action. Once a sync delivers the roster, the page SHALL show owned and unowned tiles without a reload.

#### Scenario: Anonymous user

- **GIVEN** the user is not signed in
- **WHEN** they open `/my-game/collection`
- **THEN** every catalog unit is listed greyed out by faction, no owned summary is shown, and a prompt invites them to sign in

#### Scenario: Signed in but not synced

- **GIVEN** the user is signed in and their roster has not been synced
- **WHEN** they open the page
- **THEN** every unit is listed greyed out and a prompt invites them to sync with Tacticus, offering the Sync with Tacticus action

#### Scenario: Sync completes while the page is open

- **GIVEN** a signed-in user is on the page without a synced roster
- **WHEN** a sync with Tacticus completes and delivers their roster
- **THEN** the prompt disappears and the page shows their owned units and greyed-out unowned units without a page reload

### Requirement: Collection distinguishes loading and load failure

While the game catalog is loading, the page SHALL show a loading state and SHALL NOT show the no-roster prompt or any tile. If the game catalog fails to load, the page SHALL show an error with a retry action instead of an empty list. If the catalog loads but the player's roster fails to load for a signed-in user, the page SHALL show the catalog greyed out as in the no-roster state, with an error message and retry instead of the sync prompt.

#### Scenario: Catalog loading

- **WHEN** the page opens before the game catalog is available
- **THEN** a loading state is shown and no tiles or prompts are shown

#### Scenario: Catalog failure

- **GIVEN** the game catalog fails to load
- **WHEN** the page renders
- **THEN** an error with a retry action is shown and no empty list is presented as if the catalog had no units

#### Scenario: Roster read failure

- **GIVEN** a signed-in user, the catalog loads, and reading their roster fails
- **WHEN** the page renders
- **THEN** every unit is shown greyed out with an error message and a retry action, not the sync prompt

### Requirement: Collection has a page tour

The Collection page SHALL register a page tour, startable from the page's tour control, that explains the faction groups, an owned tile's progression indicators, and greyed-out unowned units, on both desktop and mobile. Tour steps SHALL target elements that exist in the rendered layout of each form.

#### Scenario: Desktop tour

- **GIVEN** a desktop viewport
- **WHEN** the user starts the page tour
- **THEN** each step highlights an element visible on the desktop layout

#### Scenario: Mobile tour

- **GIVEN** a mobile viewport
- **WHEN** the user starts the page tour
- **THEN** each step highlights an element visible on the mobile layout
