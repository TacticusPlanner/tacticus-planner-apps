## MODIFIED Requirements

### Requirement: The query surface exposes bosses and primes as separate ordered lists

`@workspace/game-catalog/queries` SHALL expose a promise-returning accessor for raid bosses that returns bosses and primes as two ordered lists (matching the served order), each record carrying its `unitSetId`, `kind`, `isPrimarch`, `factionId`, `movement`, full ordered `statProgression`, `weapons`, ability/trait id arrays, and — when the served payload includes it — its `questUnitId` (the canonical npc id that unit set represents). It SHALL also expose the `seasons` / `seasonConfigRotation` data and a lookup from a `unitSetId` to its record. Consumers read it reactively (Dexie `useLiveQuery`) through a page-local hook.

#### Scenario: Accessor returns split lists

- **WHEN** a consumer calls the raid-boss accessor after the dataset has synced
- **THEN** it receives a bosses list and a primes list, each in served order, with the full per-unit structural data

#### Scenario: Lookup by unit-set id

- **WHEN** a consumer looks up a `unitSetId` that exists in the synced data
- **THEN** it receives that boss or prime record; an unknown id yields no record

#### Scenario: Quest-unit id is exposed when served

- **WHEN** a synced boss or prime record's served payload carries `questUnitId`
- **THEN** the accessor's record exposes that `questUnitId`, and a record whose payload omits it exposes no `questUnitId`

#### Scenario: Dataset absent

- **WHEN** the `raid-bosses` dataset has never synced into this client
- **THEN** the accessor reports the dataset as absent (distinct from "synced but empty"), so a consumer can show a feature-unavailable state

### Requirement: Raid-boss ids resolve to icons with a graceful fallback

The client SHALL resolve portraits entirely from ids, with no icon path in the served dataset:

- a **boss** or **prime** `unitSetId` resolves through ported id→asset maps (V1's `unitRoundIconMap` / `bossPortraitMap`, kept as override maps in the game-catalog package); a prime that is also a playable character MAY resolve through the existing character icon path;
- a **field npc** resolves in order: the owning unit set's `questUnitId` → the ported npc round-portrait map → the existing npc/character icon path → none;
- an ability/trait id resolves to an icon only where that iconography exists.

All portraits render through the shared entity-icon component so a missing or failed asset degrades to a text badge rather than a broken image. Ids that have no portrait asset even in V1 are documented as expected badge fallbacks.

#### Scenario: Known unit-set id renders its portrait

- **WHEN** the list renders a boss whose `unitSetId` is in the ported portrait map and whose asset file is present under the app's `game_catalog` assets
- **THEN** the portrait image is shown, not the initials badge

#### Scenario: Field npc resolves through questUnitId

- **WHEN** a field-enemy row's owning unit set carries a `questUnitId` that maps to a bundled portrait asset
- **THEN** that portrait is shown for the field enemy

#### Scenario: Missing asset degrades to a badge

- **WHEN** a boss/prime/field-npc id has no bundled portrait asset (including ids with no asset in V1)
- **THEN** a text-badge fallback is rendered in its place and no broken image appears
