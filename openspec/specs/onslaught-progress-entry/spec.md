# onslaught-progress-entry Specification

## Purpose

Lets a signed-in player record each alliance's current Onslaught position (sector and tier) on `/my-game/onslaught`, which the game API does not sync, so shard estimates use the right position.

## Requirements

### Requirement: Changing sector resets the tier

When the user changes an alliance's Sector, the Tier SHALL be set from the direction of the change: moving to a later sector in the order Stone, Iron, Bronze, Silver, Gold, Diamond, Adamantine sets the Tier to 1 (the "Sector complete" checkbox is cleared); moving to an earlier sector sets the Tier to 4 (the "Sector complete" checkbox is checked). Re-selecting the current sector SHALL leave the Tier unchanged. Choosing a sector for an alliance that is not set SHALL set the Tier to 1 and mark the alliance as set in the draft. The user MAY change the Tier afterwards, and no change is persisted until Save.

#### Scenario: Moving up a sector

- **WHEN** an alliance is at Gold with "Sector complete" checked (tier 4) and the user selects Diamond
- **THEN** the Tier control shows Tier 1, "Sector complete" is unchecked, and the draft position is Diamond 1

#### Scenario: Moving down a sector

- **WHEN** an alliance is at Diamond, Tier 1 and the user selects Gold
- **THEN** "Sector complete" is checked, the Tier control shows Tier 3, and the draft position is Gold 4

#### Scenario: Same sector

- **WHEN** an alliance is at Silver, Tier 2 and the user selects Silver again
- **THEN** the Tier stays 2

#### Scenario: First sector for an unset alliance

- **WHEN** an alliance is not set and the user selects Silver
- **THEN** the draft position is Silver 1, the "Not set" badge disappears, and the Tier control and checkbox are enabled

### Requirement: Sector completion is a separate checkbox

Each alliance card SHALL offer Tier 1, Tier 2 and Tier 3 in its Tier select and a separate "Sector complete" checkbox; tier 4 SHALL NOT be a Tier option. The stored and API value for a completed sector SHALL remain tier 4. While the checkbox is checked the Tier select SHALL show Tier 3. Checking it SHALL set tier 4; unchecking it SHALL set tier 3; choosing Tier 1 or 2 in the select SHALL clear it. Both controls SHALL be disabled while the alliance is not set.

#### Scenario: Marking a sector complete

- **WHEN** an alliance is at Iron, Tier 2 and the user checks "Sector complete"
- **THEN** the Tier select shows Tier 3 and Save sends Iron, tier 4

#### Scenario: Unmarking

- **WHEN** an alliance is at Gold with "Sector complete" checked and the user unchecks it
- **THEN** the draft position is Gold 3

#### Scenario: Tier options

- **WHEN** the user opens the Tier select
- **THEN** it lists exactly Tier 1, Tier 2 and Tier 3

### Requirement: Unsaved alliances are shown as not set

The page SHALL use the API's per-alliance `isSet` flag. An alliance with `isSet: false` SHALL show a "Not set" badge in its card header, a "Not set" placeholder in the Sector select, a disabled Tier select, and a hint to choose a sector instead of a yield. It SHALL NOT be highlighted in any row of the shard rewards reference. Save SHALL send an unset alliance as `null` so it stays unset; it SHALL send every alliance the user edited as `{ sector, tier }`.

This is platform-independent: desktop and mobile render the same cards (one column below 768px, three at or above).

#### Scenario: New profile

- **WHEN** the API reports all three alliances with `isSet: false`
- **THEN** each card shows "Not set", the Sector select shows "Not set", the Tier select is disabled, and no alliance icon appears in the reference table's current-progress column

#### Scenario: Saving one alliance

- **WHEN** all alliances are unset, the user sets Imperial to Silver and saves
- **THEN** the request is Imperial `{ Silver, 1 }`, Xenos `null`, Chaos `null`

### Requirement: Sector and tier mean the position being farmed

Below the alliance cards the page SHALL show a help line saying to pick the sector and tier currently being farmed — the one the next run uses — and to tick "Sector complete" once Tier 3 is cleared, which keeps paying Tier 3 rewards until the player moves to the next sector. The Tier options SHALL read "Tier 1", "Tier 2", "Tier 3". A position SHALL be labelled "<Sector> · Tier <n>" (or "<Sector> · Sector complete" for tier 4) in emblem alt text and the reference table, with sector names localized. Alliance names SHALL be localized. The My Game Onslaught tab description SHALL say the same and that unset alliances supply no Onslaught shards. All copy SHALL exist in en, de, es and fr.

#### Scenario: Reference table label

- **WHEN** the reference table renders the Gold tier-2 row in en
- **THEN** its label reads "Gold · Tier 2" and the emblem alt text is the same

#### Scenario: Localized sector

- **WHEN** the app language is de and an alliance is at Gold, tier 4
- **THEN** the checkbox reads "Sektor abgeschlossen" and positions read "Gold · Sektor abgeschlossen"

### Requirement: Each alliance card shows its shards per run

A set alliance's card SHALL list, for each reward rarity (Common, Uncommon, Rare, Epic, Legendary, Legendary 1★ blue, Mythic), the shard range one Onslaught run yields at its current position, in the same "min-max" format as the reference table (mythic values suffixed "M"). Tier 4 (sector complete) SHALL use the tier-3 reward row. A rarity with no catalog row SHALL be omitted. The unit is shards per run.

Assumptions:

- Rewards come from the catalog `onslaught-rewards` dataset, one row per sector and tier 1–3.
- Tier 4 has no row of its own and pays the tier-3 row.
- Shards are RNG within the row's min–max range; the card shows the range, not an average.

#### Scenario: Worked example — Gold, Tier 2 vs. sector complete

- **GIVEN** the catalog rows Gold-2 regular `[3-4, 4-5, 6-7, 10-11, 15-17]`, mythic `1-1` and Gold-3 regular `[3-4, 4-5, 6-7, 10-11, 16-18]`, mythic `1-1`
- **WHEN** Imperial is at Gold · Tier 2
- **THEN** the Imperial card shows Common 3-4, Uncommon 4-5, Rare 6-7, Epic 10-11, Legendary 15-17, Legendary blue 1M, Mythic 1M
- **AND WHEN** Imperial is at Gold · Sector complete (tier 4 → row Gold-3)
- **THEN** the Legendary entry is 16-18 and the others are unchanged

#### Scenario: Unset alliance

- **WHEN** an alliance is not set
- **THEN** its card shows the "choose a sector" hint and no shard figures

### Requirement: Sticky unsaved-changes bar

While the draft differs from the saved progress, the page SHALL show an unsaved-changes bar fixed to the bottom of the viewport with Save and Discard, and SHALL have no other Save button. The bar disappears when the draft matches the saved progress again. Discard returns every alliance to the saved progress.

#### Scenario: Save from the bar

- **GIVEN** the bar is shown
- **WHEN** the player chooses Save
- **THEN** the full draft is sent with the revision it was based on, both actions are disabled while saving, and on success a translated success message is shown and the saved values become the new baseline

#### Scenario: Bar appears and disappears

- **GIVEN** there are no unsaved changes
- **THEN** the bar is not shown
- **WHEN** the player changes an alliance's Tier
- **THEN** the bar is shown
- **WHEN** they change it back to the saved value
- **THEN** the bar is hidden

#### Scenario: Discard

- **GIVEN** the player changed two alliances
- **WHEN** they choose Discard
- **THEN** both alliances show their saved position and the bar is hidden

#### Scenario: On desktop, the bar spans the content area

- **GIVEN** a viewport at or above 768px
- **WHEN** the bar is shown
- **THEN** it is fixed to the bottom of the viewport within the page content area and does not cover the last alliance card when scrolled to the end

#### Scenario: On mobile, the bar sits above the bottom navigation

- **GIVEN** a viewport below 768px
- **WHEN** the bar is shown
- **THEN** it is fixed directly above the mobile bottom navigation, does not overlap it, and does not cover the last alliance card when scrolled to the end

### Requirement: Save conflicts and errors are translated

A save SHALL carry the revision of the saved progress the draft was built on, even if newer progress loaded in the background since the first edit. A revision conflict reloads the saved progress, drops the draft and shows a translated conflict message; any other failure keeps the draft and the bar and shows a translated general save-error message. Raw API error text SHALL NOT be shown.

#### Scenario: Revision conflict

- **GIVEN** the progress was saved from another tab after this page loaded
- **WHEN** the player saves
- **THEN** the page shows the other tab's saved positions, the bar is hidden, and the translated conflict message is shown

#### Scenario: Other API error

- **GIVEN** the API rejects the save with a validation error carrying its own message text
- **WHEN** the player saves
- **THEN** the translated general save-error message is shown instead of the API's text, and the edits and bar remain

### Requirement: Leaving with unsaved edits asks first

While there are unsaved changes, navigating to another route inside the app SHALL ask the player to confirm leaving, with options to stay or to leave and lose the changes. Closing or reloading the browser tab SHALL trigger the browser's own leave confirmation. With no unsaved changes, navigation SHALL NOT be interrupted.

#### Scenario: In-app navigation with edits

- **GIVEN** there are unsaved changes
- **WHEN** the player selects another My Game tab
- **THEN** a confirmation asks whether to leave; choosing Stay keeps the page and edits, choosing Leave navigates away and discards them

#### Scenario: Navigation without edits

- **GIVEN** there are no unsaved changes
- **WHEN** the player selects another My Game tab
- **THEN** navigation happens without a confirmation
