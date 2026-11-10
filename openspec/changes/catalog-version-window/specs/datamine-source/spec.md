# Spec Delta

## ADDED Requirements

### Requirement: Generated game data is pinned to a latest and a previous data-mines commit

The web app SHALL record two `tacticus-planner-data-mines` commits, `latest` and `previous`, that its generated game text and catalog images come from, matching the API's two pins. On the default branch each record SHALL be a data-mines release tag followed by that commit's full SHA (or the full SHA alone), never a branch name or a local marker. The SHA SHALL be authoritative when the tag has since moved. Pulling a new release SHALL make the old `latest` the new `previous`.

#### Scenario: Pulling a new release rolls the pins

- **GIVEN** `latest` is `v1.44.87.3088` and `previous` is `v1.43.157.2989`
- **WHEN** a developer pulls data-mines tag `v1.45.0.3200`
- **THEN** `latest` is `v1.45.0.3200` with its full SHA and `previous` is `v1.44.87.3088` with its SHA

#### Scenario: Refreshing a moved tag

- **WHEN** a developer refreshes `latest` at `v1.44.87.3088` after the tag moved
- **THEN** only `latest` records the new SHA

#### Scenario: Local copy is marked unpinned

- **WHEN** a developer copies one release's files from a local data-mines checkout
- **THEN** that release's recorded pin is `local`

#### Scenario: Unpinned copy cannot pass CI

- **WHEN** CI runs on a change where either recorded pin is `local`
- **THEN** the build fails and says to pull a data-mines tag

### Requirement: Generators write the union of both releases

Every generator that writes game text SHALL read both pinned releases and write an entry for every id either release has. Where both have an id, the `latest` release's text and tables SHALL be used. An id only `previous` has keeps its `previous` text.

#### Scenario: An id only the previous release has

- **GIVEN** an NPC ability that `previous` references and `latest` no longer does
- **WHEN** the generators run
- **THEN** its rules text is still generated, from `previous`, so a player on the previous release sees it

#### Scenario: Reworded ability

- **GIVEN** `WaaaghEnergy` is worded differently in the two releases
- **WHEN** the generators run
- **THEN** its entry carries the `v1.44.87.3088` wording

## MODIFIED Requirements

### Requirement: Only listed data-mines files are fetched, into an uncommitted cache

Generators SHALL read data-mines files only through an allowlist of repo-relative paths (a path ending in `/` names a whole folder) and only from a cache folder per release that is not committed. Each release's cache SHALL be refilled when its pin or the allowlist changes. Raw data-mines files SHALL NOT be committed to this repository; only generated output is.

#### Scenario: Cache follows the pin

- **WHEN** the `latest` pin changes and a generator asks for the data
- **THEN** the `latest` cache is refetched at the new commit before the generator reads it, and the `previous` cache is reused if its pin is unchanged

#### Scenario: Cache follows the allowlist

- **WHEN** a folder is added to the allowlist and the data is synced
- **THEN** that folder's files at each pinned commit are in that release's cache

#### Scenario: Stale local copy is refused

- **WHEN** a pin is `local` and the allowlist changed since the last copy
- **THEN** syncing fails and names the command that re-copies from the local checkout

### Requirement: Game sprites are copied unchanged from the pinned data-mines commit

Catalog images that are game sprites SHALL be served from `public/game_catalog/datamines/`, as byte-for-byte copies of the `sprites-webp/` file at the same relative path and file name, taken from the `latest` pin, or from `previous` when only it has the file. A committed allowlist SHALL name every copied sprite, and the folder SHALL hold exactly the listed files. Icon helpers SHALL build these URLs from the game's own path and name, with an explicit override where an id differs from the game's file name.

#### Scenario: Copying follows the list

- **WHEN** a developer runs the sprite copy after changing a pin or the list
- **THEN** every listed sprite is copied unchanged from the `latest` cache (or from `previous` when only it has the file), and any file under `datamines/` that is not listed is deleted

#### Scenario: A listed sprite is missing at the pin

- **WHEN** a listed sprite is in neither release's cache
- **THEN** the copy fails and names the missing paths

#### Scenario: Folder and list drift

- **WHEN** CI runs on a change where `public/game_catalog/datamines/` and the list differ
- **THEN** the build fails and says to run the sprite copy

### Requirement: Game name namespaces come from the pinned datamine

The `upgrades`, `abilities`, `equipmentItems`, `characters`, `mows`, `traits`, `factions` and `mythicQuestTasks`
namespaces SHALL be written in English, German, Spanish and French by a committed generator that reads only the
two pinned data-mines releases. Each namespace's ids SHALL be the union of both releases' game config ids, and
their terms SHALL come from the game's language files, taken from `latest` for an id it has and from `previous`
otherwise, with a term missing in one locale falling back to English. Ids or terms the game lacks or gets
wrong SHALL come from a curated file that gives a reason for each entry; a curated term wins in the locales it
gives and is the fallback for the others. The generator SHALL exit non-zero when an id has no term anywhere, and
running it twice on the same pins SHALL produce identical files.

#### Scenario: Game spelling

- **WHEN** the namespaces are generated with `latest` `v1.44.87.3088`
- **THEN** `characters` names `votanUthar` "Ûthar" in English, as the game does

#### Scenario: Curated term

- **GIVEN** the curated file gives the `Mounted` trait the English term "Mounted"
- **WHEN** the namespaces are generated
- **THEN** every locale's `traits` names `Mounted` "Mounted"

#### Scenario: Locales stay aligned

- **GIVEN** the generated files are committed
- **WHEN** the apps test suite runs
- **THEN** each of the eight namespaces has the same ids in all four locales and no empty term

#### Scenario: A unit only in the newer release

- **WHEN** the namespaces are generated with `latest` `v1.44.87.3088` and `previous` `v1.43.157.2989`
- **THEN** `characters` names `lostaFearmonger` "Daras", from `v1.44.87.3088`

## REMOVED Requirements

### Requirement: Generated game data is pinned to one data-mines commit

**Reason**: The app now generates from two releases, matching the API; see "Generated game data is pinned to a latest and a previous data-mines commit".

**Migration**: Replace the one-line `apps/web/datamine/REF` with the two-pin record, `latest` from today's pin and `previous` from `v1.43.157.2989`, and re-run the generators.
