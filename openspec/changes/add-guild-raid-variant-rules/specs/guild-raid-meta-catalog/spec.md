## ADDED Requirements

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

- **WHEN** a downloaded recommendation has duplicate identity, misaligned slots, or invalid replacement structure
- **THEN** catalog synchronization fails without replacing the previously valid local Meta record

### Requirement: Variant-rule presentation remains client-owned

The app SHALL resolve replacement character and Machine-of-War ids through existing catalog presentation and SHALL map known `roleId` values to localized role labels. Unknown unit or role ids SHALL use readable fallbacks without broken images. The app SHALL NOT expect names, notes, icon paths, or localized labels from the API.

#### Scenario: Replacement presentation resolves locally

- **WHEN** a rule references known catalog units and a known role id
- **THEN** the app exposes their local names, portraits, and localized role label to consumers

#### Scenario: New role id precedes client copy

- **WHEN** valid synced data contains a role id unknown to the current client
- **THEN** the role remains available through a readable non-localized fallback and the recommendation is not discarded
