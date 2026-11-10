# Spec Delta

## ADDED Requirements

### Requirement: The Preferences section offers a game data picker

The Preferences section of the account card (desktop popover and mobile drawer) and of the signed-out menu SHALL have a "Game data" row below Language. The row shows the selected release on its right with a chevron and opens an in-card picker, like Language. The picker SHALL list `Latest` with the latest version, then the previous release. It SHALL mark the selection, apply a choice through `catalog-version-selection`, and return to the main card.

#### Scenario: Picking the previous release

- **GIVEN** the API serves `1.44.87.3088` (Latest) and `1.43.157.2989` (Previous)
- **WHEN** a signed-in player on Latest opens the Game data row
- **THEN** the picker lists "Latest (1.44.87)" selected and "1.43.157", and choosing "1.43.157" returns to the main card with the row showing "1.43.157"

#### Scenario: Picking a release that must download

- **WHEN** a player picks a release with no complete local catalog
- **THEN** the picker shows that the release is downloading, and the row changes only when the download and save succeed

#### Scenario: Signed-out menu

- **WHEN** a signed-out visitor opens the menu and picks "1.43.157"
- **THEN** the selection is kept on the device and the row shows "1.43.157"

#### Scenario: Release list unavailable

- **WHEN** the list of served releases cannot be fetched
- **THEN** the Game data row shows the selected version and its picker lists only that release, with a note that other releases are unavailable

### Requirement: The catalog footer names the selected release

The account card's catalog status footer SHALL show the selected release's game version, followed by "(latest)" when the selection is `Latest`, keeping its existing low-emphasis and error styling.

#### Scenario: On the previous release

- **WHEN** a player on `1.43.157.2989` opens the account card
- **THEN** the footer shows the 1.43.157 catalog version without "(latest)"
