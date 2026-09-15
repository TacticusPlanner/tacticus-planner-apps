# guild-raid-meta-catalog Specification

## Purpose

Makes curated Guild Raid Boss Meta and Comp guidance available to V2 features
as a validated, reactive client-catalog dataset with presentation resolved from
existing game-data ids.

## Requirements

### Requirement: The Guild Raid Meta dataset is synced and stored as one catalog object

The client SHALL recognize `guild-raid-meta` as a served game-catalog dataset,
validate its `sourceId`, `updatedOn`, `comps`, `bosses`, and `primes` payload
structure, and store the whole object reactively under a stable local record
id. The payload SHALL retain the API contract's ordered Comp profiles, boss
groups, prime groups, recommendations, hero slots, Machine-of-War ids, and
source/update identifiers without adding presentation fields.

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

The game-catalog query surface SHALL expose the full Meta object, a lookup by
`bossUnitSetId`, and a lookup by prime `unitSetId` into `primes`. A returned
boss group SHALL expose an ordered `primeUnitSetIds` array (zero or more prime
unit-set ids fought alongside that boss). A returned recommendation SHALL
expose its `kind` (a non-empty archetype id — not restricted to a fixed set),
exactly five ordered `heroSlots` (each with its own `heroId`, `essential`
weighting, and `replacementCharacterIds`), one Machine-of-War id, ordered
Comp ids, and a positive `efficiency` number. A returned Comp SHALL expose
its id, signature-unit id, ordered core-character ids, flex-character ids,
and Machine-of-War ids.

A boss or prime group MAY carry any number of recommendations (one or more);
the query surface SHALL NOT assume or enforce exactly two.

The query surface SHALL preserve the source ordering and SHALL not infer,
rename, or rank recommendations, Comps, heroes, or Machines of War.
`efficiency` is relative within its own boss/prime group only — the query
surface SHALL NOT compare it across different bosses or primes or present it
as a cross-boss difficulty ranking.

#### Scenario: A feature reads a boss's recommendations

- **WHEN** a feature queries a boss id present in synced Meta data
- **THEN** it receives that boss's authored recommendations, however many are
  present, in authored order with their exact lineup, Comp references, and
  `efficiency` value, plus that boss's `primeUnitSetIds`

#### Scenario: A feature reads Comp guidance

- **WHEN** a feature reads a Comp profile from synced Meta data
- **THEN** it receives the profile's ordered core, flex, and Machine-of-War
  ids without any server-supplied label or image path

#### Scenario: A feature reads a boss's primes

- **WHEN** a feature queries a boss group with a non-empty `primeUnitSetIds`
- **THEN** it receives each prime's unit-set id in authored order

#### Scenario: A feature reads a prime's curated recommendations

- **WHEN** a feature queries a prime id present in synced `primes` data
- **THEN** it receives that prime's authored recommendations in authored
  order with the same shape as a boss recommendation

#### Scenario: A prime has no curated recommendation

- **WHEN** a feature queries a prime id referenced by a boss's
  `primeUnitSetIds` but absent from `primes`
- **THEN** the query surface reports no curated recommendation for that prime
  rather than an error, distinct from an absent dataset

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

### Requirement: Typed Meta access preserves explicit variant rules

The client SHALL validate, persist, and expose every recommendation's non-empty globally unique `id`, ordered five-item `heroSlots`, and ordered `mowReplacementIds`. Each slot SHALL expose the exact `heroId`, stable `roleId`, `essential` flag, and ordered `replacementCharacterIds`, aligned one-to-one with the recommendation's five exact heroes.

The query surface SHALL preserve authored order and SHALL NOT infer replacements from Comp core/flex/Machine-of-War pools. An empty replacement list SHALL remain distinguishable from absent or malformed variant-rule data.

#### Scenario: Feature reads authored slot guidance

- **WHEN** a feature reads a valid recommendation
- **THEN** it receives five aligned slot rules and ordered explicit character/Machine-of-War replacements unchanged

#### Scenario: Slot has no allowed substitute

- **WHEN** a valid slot has an empty replacement list
- **THEN** the query returns that empty list and does not fill it from referenced Comp profiles

#### Scenario: Malformed rules fail synchronization

- **WHEN** a downloaded recommendation has duplicate identity, fewer than five hero slots, or invalid replacement structure
- **THEN** catalog synchronization fails without replacing the previously valid local Meta record

### Requirement: Variant-rule presentation remains client-owned

The app SHALL resolve replacement character and Machine-of-War ids through existing catalog presentation and SHALL map known `roleId` values to localized role labels. Unknown unit or role ids SHALL use readable fallbacks without broken images. The app SHALL NOT expect names, notes, icon paths, or localized labels from the API.

#### Scenario: Replacement presentation resolves locally

- **WHEN** a rule references known catalog units and a known role id
- **THEN** the app exposes their local names, portraits, and localized role label to consumers

#### Scenario: New role id precedes client copy

- **WHEN** valid synced data contains a role id unknown to the current client
- **THEN** the role remains available through a readable non-localized fallback and the recommendation is not discarded
