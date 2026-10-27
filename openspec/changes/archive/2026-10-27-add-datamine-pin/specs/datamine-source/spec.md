# Spec Delta

## ADDED Requirements

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
