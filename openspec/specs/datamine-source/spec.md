# datamine-source Specification

## Purpose

Pins the web app's generated game text and catalog images to one `tacticus-planner-data-mines` commit, and defines how generators read only allowlisted data-mines files from an uncommitted cache, copy game sprites unchanged, keep game sprites apart from curated images, and generate the game name namespaces from that pin.

## Requirements

### Requirement: Generated game data is pinned to one data-mines commit

The web app SHALL record the `tacticus-planner-data-mines` commit that its generated game text and catalog images come from. On the default branch the record SHALL be a data-mines release tag followed by that commit's full SHA (or the full SHA alone), never a branch name or a local marker. The SHA SHALL be authoritative when the tag has since moved.

#### Scenario: Pulling a tag records its commit

- **WHEN** a developer pulls data-mines tag `v1.43.157.2989`
- **THEN** the recorded pin is `v1.43.157.2989` followed by the full SHA that tag points at

#### Scenario: Local copy is marked unpinned

- **WHEN** a developer copies the files from a local data-mines checkout
- **THEN** the recorded pin is `local`

#### Scenario: Unpinned copy cannot pass CI

- **WHEN** CI runs on a change whose recorded pin is `local`
- **THEN** the build fails and says to pull a data-mines tag

### Requirement: Only listed data-mines files are fetched, into an uncommitted cache

Generators SHALL read data-mines files only through an allowlist of repo-relative paths (a path ending in `/` names a whole folder) and only from a cache folder that is not committed. The cache SHALL be refilled when the pin or the allowlist changes. Raw data-mines files SHALL NOT be committed to this repository; only generated output is.

#### Scenario: Cache follows the pin

- **WHEN** the pin changes and a generator asks for the data
- **THEN** the cache is refetched at the new commit before the generator reads it

#### Scenario: Cache follows the allowlist

- **WHEN** a folder is added to the allowlist and the data is synced
- **THEN** that folder's files at the pinned commit are in the cache

#### Scenario: Stale local copy is refused

- **WHEN** the pin is `local` and the allowlist changed since the last copy
- **THEN** syncing fails and names the command that re-copies from the local checkout

### Requirement: Game sprites are copied unchanged from the pinned data-mines commit

Catalog images that are game sprites SHALL be served from `public/game_catalog/datamines/`, as byte-for-byte copies of the pinned data-mines `sprites-webp/` files at the same relative path and file name. A committed allowlist SHALL name every copied sprite, and the folder SHALL hold exactly the listed files. Icon helpers SHALL build these URLs from the game's own path and name, with an explicit override where an id differs from the game's file name.

#### Scenario: Copying follows the list

- **WHEN** a developer runs the sprite copy after changing the pin or the list
- **THEN** every listed sprite is copied unchanged from the cache, and any file under `datamines/` that is not listed is deleted

#### Scenario: A listed sprite is missing at the pin

- **WHEN** a listed sprite is not in the datamine cache
- **THEN** the copy fails and names the missing paths

#### Scenario: Folder and list drift

- **WHEN** CI runs on a change where `public/game_catalog/datamines/` and the list differ
- **THEN** the build fails and says to run the sprite copy

### Requirement: Catalog images are game sprites or curated

Every image under `public/game_catalog/` SHALL be either a pinned game sprite under `datamines/` or an image the game ships no file for under `curated/`. Nothing else SHALL sit directly under `public/game_catalog/`. An icon the game draws by stacking sprites SHALL be described as layers of game sprites and stacked when rendered, not committed as a combined image.

#### Scenario: A file outside the two folders

- **WHEN** CI runs on a change that adds a file or folder directly under `public/game_catalog/` other than `datamines/` and `curated/`
- **THEN** the build fails and names it

#### Scenario: An ability badge renders

- **WHEN** the app shows an ability badge for a rarity and alliance
- **THEN** it stacks the game's rarity frame and alliance emblem sprites from `datamines/` in one square box

### Requirement: Game name namespaces come from the pinned datamine

The `upgrades`, `abilities`, `equipmentItems`, `characters`, `mows`, `traits`, `factions` and `mythicQuestTasks`
namespaces SHALL be written in English, German, Spanish and French by a committed generator that reads only the
pinned data-mines files. Each namespace's ids SHALL come from the game config and its terms from the game's
language files, with a term missing in one locale falling back to English. Ids or terms the game lacks or gets
wrong SHALL come from a curated file that gives a reason for each entry; a curated term wins in the locales it
gives and is the fallback for the others. The generator SHALL exit non-zero when an id has no term anywhere, and
running it twice on the same pin SHALL produce identical files.

#### Scenario: Game spelling

- **WHEN** the namespaces are generated from data-mines `v1.43.157.2989`
- **THEN** `characters` names `votanUthar` "Ûthar" in English, as the game does

#### Scenario: Curated term

- **GIVEN** the curated file gives the `Mounted` trait the English term "Mounted"
- **WHEN** the namespaces are generated
- **THEN** every locale's `traits` names `Mounted` "Mounted"

#### Scenario: Locales stay aligned

- **GIVEN** the generated files are committed
- **WHEN** the apps test suite runs
- **THEN** each of the eight namespaces has the same ids in all four locales and no empty term
