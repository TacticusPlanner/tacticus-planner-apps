## Purpose

Makes curated Guild Raid Boss Meta and Comp guidance available to V2 features
as a validated, reactive client-catalog dataset with presentation resolved from
existing game-data ids.

## ADDED Requirements

### Requirement: The Guild Raid Meta dataset is synced and stored as one catalog object

The client SHALL recognize `guild-raid-meta` as a served game-catalog dataset,
validate its `sourceId`, `updatedOn`, `comps`, and `bosses` payload structure,
and store the whole object reactively under a stable local record id. The
payload SHALL retain the API contract's ordered Comp profiles, boss groups,
recommendations, hero ids, Machine-of-War ids, evidence, and source/update
identifiers without adding presentation fields.

The client SHALL distinguish an absent local dataset from a valid synced
dataset whose `bosses` collection has no group for a particular boss. A
malformed download SHALL fail the catalog sync without leaving a partial local
record; a database upgrade SHALL preserve all existing catalog records.

#### Scenario: Changed Meta data synchronizes independently

- **WHEN** the manifest reports a changed `guild-raid-meta` hash
- **THEN** the client validates and replaces the locally stored Meta object
  without re-downloading an unchanged `raid-bosses` dataset

#### Scenario: Meta data has not been synchronized

- **WHEN** no `guild-raid-meta` record exists locally
- **THEN** the query surface reports the dataset as absent rather than an empty
  recommendation list

#### Scenario: A boss has no published recommendation

- **WHEN** a valid synced Meta object contains no group for a selected boss id
- **THEN** the query surface returns the dataset and reports no recommendation
  for that boss

### Requirement: Typed query access preserves the curated Meta contract

The game-catalog query surface SHALL expose the full Meta object and a lookup
by `bossUnitSetId`. A returned recommendation SHALL expose its `kind`, exactly
five ordered hero ids, one Machine-of-War id, ordered Comp ids, and optional
replay evidence. A returned Comp SHALL expose its id, signature-unit id,
ordered core-character ids, flex-character ids, and Machine-of-War ids.

The query surface SHALL preserve the source ordering and SHALL not infer,
rename, or rank recommendations, Comps, heroes, or Machines of War.

#### Scenario: A feature reads a boss's recommendations

- **WHEN** a feature queries a boss id present in synced Meta data
- **THEN** it receives that boss's authored Meta/alternate recommendations in
  authored order with their exact lineup and Comp references

#### Scenario: A feature reads Comp guidance

- **WHEN** a feature reads a Comp profile from synced Meta data
- **THEN** it receives the profile's ordered core, flex, and Machine-of-War
  ids without any server-supplied label or image path

### Requirement: The app resolves Meta presentation from ids and known sources

App-level Meta presentation SHALL resolve character and Machine-of-War names
and portraits from their existing catalog ids, boss names from the raid-boss
label resolver, and Comp signature images from their `signatureUnitId`.
Missing catalog presentation data SHALL degrade to the existing readable
name/badge fallback rather than a broken image.

The initial known `sourceId` for the curated guide SHALL resolve in the client
to a visible source attribution and the supplied Guild Raid Boss Meta Guide
URL. Source ids unknown to the client SHALL show a non-linked generic
attribution, never an invented URL.

#### Scenario: A Meta lineup uses mixed unit types

- **WHEN** a recommendation contains five character ids and one Machine-of-War
  id
- **THEN** the app resolves each available unit to its appropriate name and
  portrait, while any unavailable asset uses a readable fallback

#### Scenario: The known source is attributed

- **WHEN** a feature renders Meta data whose `sourceId` is the known guide
  source
- **THEN** it can render localized attribution with a link to the supplied
  Guild Raid Boss Meta Guide URL
