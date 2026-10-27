# Spec Delta

## ADDED Requirements

### Requirement: Catalog images are game sprites or curated

Every image under `public/game_catalog/` SHALL be either a pinned game sprite under `datamines/` or an image the game ships no file for under `curated/`. Nothing else SHALL sit directly under `public/game_catalog/`. An icon the game draws by stacking sprites SHALL be described as layers of game sprites and stacked when rendered, not committed as a combined image.

#### Scenario: A file outside the two folders

- **WHEN** CI runs on a change that adds a file or folder directly under `public/game_catalog/` other than `datamines/` and `curated/`
- **THEN** the build fails and names it

#### Scenario: An ability badge renders

- **WHEN** the app shows an ability badge for a rarity and alliance
- **THEN** it stacks the game's rarity frame and alliance emblem sprites from `datamines/` in one square box
