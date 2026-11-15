# Spec Delta

## Purpose

Lets each player plan with the game catalog release that matches their game during an update rollout: which release the client uses, where that choice is kept, how each release's data is stored and synced, and how ids the chosen release lacks are shown.

## ADDED Requirements

### Requirement: The client plans with one selected catalog release

The client SHALL read every catalog dataset from one selected release, which is either `Latest` (follows the API's latest release) or one exact game version that the API serves. A visitor who never chose SHALL be on `Latest`. Every catalog-derived view and calculation SHALL use the selected release only and recompute when it changes, without a page reload.

#### Scenario: Quest events follow the selection

- **GIVEN** the API serves `1.44.87.3088` (Latest) and `1.43.157.2989` (Previous)
- **WHEN** a player on `Latest` opens the quest events and then selects `1.43.157.2989`
- **THEN** the list first shows `astarEradicator`, `lostaFearmonger`, `orksWeirdboy`, `tyranParasite` and `votanChampion`, and after the switch shows `astarCyrus`, `astarEradicator`, `darkaSternguard`, `thousSekhetar` and `votanChampion`, without a reload

#### Scenario: A new visitor

- **WHEN** a visitor with no stored choice opens the app
- **THEN** the client uses the API's latest release

### Requirement: Signed-in players keep their choice in their account

For a signed-in player the selection SHALL come from the account settings' `effectiveCatalogVersion`, and choosing a release SHALL save `catalogVersion` (`Latest` or the game version) to the account, so it follows the player across devices. Until settings have loaded, the client SHALL start with the release last used on this device and switch if the account says otherwise.

#### Scenario: Choice follows the player

- **WHEN** a player selects `1.43.157.2989` on one device and later signs in on another
- **THEN** the second device plans with `1.43.157.2989` once settings load

#### Scenario: Saving fails

- **WHEN** saving the selection fails, for example offline or on a revision conflict
- **THEN** the selection is not changed, the previous release stays in use, and an error toast says the choice was not saved

### Requirement: Guests keep their choice on the device

A signed-out visitor's selection SHALL be kept in browser storage on that device. It SHALL survive reloads and SHALL NOT be cleared by sign-out. When storage is unavailable the visitor SHALL be on `Latest`. On sign-in, the account's setting SHALL win.

#### Scenario: Guest reload

- **WHEN** a guest selects `1.43.157.2989` and reloads
- **THEN** the app still plans with `1.43.157.2989`

#### Scenario: Guest signs in

- **GIVEN** a guest on `1.43.157.2989` whose account setting is `Latest`
- **WHEN** they sign in
- **THEN** the app switches to the latest release

### Requirement: Each release is cached in its own browser database

Each release SHALL be cached in its own IndexedDB database named after its game version (`tacticus-planner-game-catalog-<gameVersion>`). A database SHALL only ever hold datasets of its own release, written through that release's manifest. Only the selected release SHALL be synced when the app starts. Another release SHALL be downloaded the first time it is selected.

#### Scenario: Switching to a release already cached

- **GIVEN** both `1.44.87.3088` and `1.43.157.2989` have complete databases
- **WHEN** the player switches between them, online or offline
- **THEN** the switch makes no dataset request and the views update from the other database

#### Scenario: First switch to a release

- **WHEN** a player selects `1.43.157.2989` for the first time
- **THEN** its datasets download with the existing catalog download progress, the selection takes effect when the download completes, and the latest database is untouched

#### Scenario: The download fails

- **WHEN** the first download of `1.43.157.2989` fails part-way
- **THEN** the player stays on the release they had, a retryable error is shown, and no dataset of `1.43.157.2989` is read until its database is complete

### Requirement: Databases for releases no longer served are removed

When the app starts and has the API's list of served releases, it SHALL delete every `tacticus-planner-game-catalog-<gameVersion>` database whose game version is not in the list. It SHALL delete the legacy unversioned `tacticus-planner-game-catalog` database once the selected release's versioned database is complete. When the list cannot be fetched, nothing SHALL be deleted.

#### Scenario: The window rolls

- **GIVEN** databases for `1.44.87.3088` and `1.43.157.2989`
- **WHEN** the API starts serving `1.45.x` and `1.44.87.3088`
- **THEN** on the next start the `1.43.157.2989` database is deleted and `1.44.87.3088` is kept

#### Scenario: Upgrading from the single catalog

- **WHEN** a returning visitor's first start after this change completes the `1.44.87.3088` database
- **THEN** the old `tacticus-planner-game-catalog` database is deleted

### Requirement: A pin that left the window falls back to Latest

When a signed-in player's stored `catalogVersion` names a release the API no longer serves (`effectiveCatalogVersion` is then the latest release), or a guest's stored version is not served, the client SHALL plan with the latest release, mark the selection as `Latest`, and show a one-time notice naming both versions.

#### Scenario: Pinned to a retired release

- **GIVEN** a player pinned to `1.43.157.2989`
- **WHEN** the API serves `1.45.x` and `1.44.87.3088` and the player opens the app
- **THEN** the app plans with `1.45.x`, the picker shows Latest selected, and a notice says `1.43.157` is no longer available and `1.45` is now used

### Requirement: Ids the selected release lacks render gracefully

Player data, goals and locally tracked progress can name an id that the selected release does not have, for example a unit from the newer release that a sync already returned. Such an id SHALL render with its name from the generated text when there is one, otherwise the raw id, and with the generic unknown-item icon. It SHALL be left out of calculations that need its catalog record, and SHALL NOT throw or blank the page.

#### Scenario: A newer unit while on the previous release

- **GIVEN** a synced roster containing `lostaFearmonger` and a player on `1.43.157.2989`
- **WHEN** the roster page renders
- **THEN** Daras is listed by name with the generic icon, the page renders normally, and raid suggestions leave Daras out
