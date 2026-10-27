# Spec Delta

## ADDED Requirements

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
