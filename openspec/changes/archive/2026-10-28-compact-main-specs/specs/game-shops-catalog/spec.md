## MODIFIED Requirements

### Requirement: The `shops` dataset is synced and stored one record per shop

The client SHALL treat `shops` as a served game-catalog dataset: it participates in the existing
manifest-diff sync, is validated against a schema on download, and is stored in the game-catalog
IndexedDB database as one record per shop (keyed by the shop's `id`), not as a single combined
record. Adding the store SHALL follow the package's version-cascade upgrade mechanism (a bumped
database version with a new complete `stores()` block).

#### Scenario: Shops sync into their own store

- **WHEN** the game catalog completes a sync that includes the `shops` dataset
- **THEN** the `shops` IndexedDB store contains one record per daily shop, each retrievable by its shop id

#### Scenario: Schema rejects a malformed shop payload

- **WHEN** a `shops` dataset payload fails its schema validation
- **THEN** the sync surfaces the failure the same way it does for any other dataset and the store is not left partially written

#### Scenario: Existing databases upgrade without data loss

- **WHEN** a client whose game-catalog database predates the `shops` store loads the app
- **THEN** the database upgrades to the new version, the `shops` store is created, and the other datasets' stored records are preserved
