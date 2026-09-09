# raid-boss-catalog Specification

## Purpose

Gives the client game-catalog package its raid-boss data layer: the synced-and-stored `raid-bosses` dataset (bosses, primes, season configs) and the query surface plus id-to-label/icon resolution that lets Library features render a raid-boss list and per-boss detail without re-implementing the datamine's shape or joining season configs against unit sets.

## Requirements

### Requirement: The `raid-bosses` dataset is synced, validated, and stored

The client SHALL treat `raid-bosses` as a served game-catalog dataset: it participates in the existing manifest-diff sync, is validated against a schema on download, and is written to the game-catalog IndexedDB database. Adding the store(s) SHALL follow the package's version-cascade upgrade mechanism (a bumped database version with a new complete `stores()` block), preserving every other dataset's stored records.

#### Scenario: Raid bosses sync into storage

- **WHEN** the game catalog completes a sync that includes the `raid-bosses` dataset
- **THEN** the stored raid-boss data is retrievable, with bosses and primes each individually addressable by their unit-set id

#### Scenario: Schema rejects a malformed payload

- **WHEN** a `raid-bosses` dataset payload fails its schema validation
- **THEN** the sync surfaces the failure the same way it does for any other dataset and the store is not left partially written

#### Scenario: Existing databases upgrade without data loss

- **WHEN** a client with an earlier game-catalog database version loads the app after this change
- **THEN** the database upgrades, the raid-boss store(s) are created, and the other datasets' stored records are preserved

### Requirement: The query surface exposes bosses and primes as separate ordered lists

`@workspace/game-catalog/queries` SHALL expose a promise-returning accessor for raid bosses that returns bosses and primes as two ordered lists (matching the served order), each record carrying its `unitSetId`, `kind`, `isPrimarch`, `factionId`, `movement`, full ordered `statProgression`, `weapons`, and ability/trait id arrays. It SHALL also expose the `seasons` / `seasonConfigRotation` data and a lookup from a `unitSetId` to its record. Consumers read it reactively (Dexie `useLiveQuery`) through a page-local hook.

#### Scenario: Accessor returns split lists

- **WHEN** a consumer calls the raid-boss accessor after the dataset has synced
- **THEN** it receives a bosses list and a primes list, each in served order, with the full per-unit structural data

#### Scenario: Lookup by unit-set id

- **WHEN** a consumer looks up a `unitSetId` that exists in the synced data
- **THEN** it receives that boss or prime record; an unknown id yields no record

#### Scenario: Dataset absent

- **WHEN** the `raid-bosses` dataset has never synced into this client
- **THEN** the accessor reports the dataset as absent (distinct from "synced but empty"), so a consumer can show a feature-unavailable state

### Requirement: Raid-boss ids resolve to labels through dedicated namespaces

The client SHALL resolve a raid-boss or prime `unitSetId` to a display label via a `raidBosses` i18n namespace keyed by that id, an ability id via `raidBossAbilities`, and a trait id via `raidBossTraits`, each with a catalog/derived `defaultValue` fallback. `en` SHALL carry real values; `de`/`es`/`fr` SHALL be present (falling back to `en` where a translation is not yet authored, at sibling-namespace quality once authored). Namespaces SHALL be lazily loaded by the consuming page.

#### Scenario: Known id resolves to its namespace label

- **WHEN** the UI renders a boss whose `unitSetId` has a `raidBosses` entry in the active locale
- **THEN** that translated label is shown

#### Scenario: Missing translation falls back

- **WHEN** a boss/prime/ability/trait id has no entry in the active non-English locale
- **THEN** the English value is shown rather than the raw id

### Requirement: Raid-boss ids resolve to icons with a graceful fallback

The client SHALL map a raid-boss unit-set id, a field-npc id, and (where iconography exists) an ability/trait id to an image path via helpers in the game-catalog package, rendered through the shared entity-icon component so a missing asset degrades to a text badge rather than a broken image. The served dataset carries no icon paths — resolution is entirely client-side.

#### Scenario: Known unit-set id renders its portrait

- **WHEN** the list renders a boss whose portrait asset is present in the app's public assets
- **THEN** the portrait image is shown

#### Scenario: Missing asset degrades to a badge

- **WHEN** a boss/prime/field-npc id has no bundled portrait asset
- **THEN** a text-badge fallback is rendered in its place and no broken image appears
