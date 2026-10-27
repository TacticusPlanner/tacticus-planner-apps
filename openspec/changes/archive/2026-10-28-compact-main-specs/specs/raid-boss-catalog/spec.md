## MODIFIED Requirements

### Requirement: The `raid-bosses` dataset is synced, validated, and stored

The client SHALL treat `raid-bosses` as a served game-catalog dataset: it participates in the existing manifest-diff sync, is validated against a schema on download, and is written to the game-catalog IndexedDB database. Adding the store(s) SHALL follow the package's version-cascade upgrade mechanism (a bumped database version with a new complete `stores()` block), preserving every other dataset's stored records.

#### Scenario: Raid bosses sync into storage

- **WHEN** the game catalog completes a sync that includes the `raid-bosses` dataset
- **THEN** the stored raid-boss data is retrievable, with bosses and primes each individually addressable by their unit-set id

#### Scenario: Schema rejects a malformed payload

- **WHEN** a `raid-bosses` dataset payload fails its schema validation
- **THEN** the sync surfaces the failure the same way it does for any other dataset and the store is not left partially written

#### Scenario: Existing databases upgrade without data loss

- **WHEN** a client whose game-catalog database predates the raid-boss store(s) loads the app
- **THEN** the database upgrades, the raid-boss store(s) are created, and the other datasets' stored records are preserved
