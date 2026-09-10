## Purpose

Compares curated exact Guild Raid Meta lineups with the player's owned roster so ideal teams and concrete gaps are visible before substitution logic exists.

## ADDED Requirements

### Requirement: Exact recommendations are selected by the active boss

The system SHALL use the active status boss `unitSetId` to retrieve that boss's ordered Guild Raid Meta recommendations. It SHALL preserve the authored recommendation, hero, Machine-of-War, and Comp ordering and SHALL recompute when the boss, Meta dataset, or current player roster changes.

#### Scenario: Active boss has recommendations

- **WHEN** the active boss id has a group in the synchronized Meta dataset
- **THEN** its exact Meta and alternate recommendations are evaluated and displayed in authored order

#### Scenario: Boss changes

- **WHEN** refreshed guild status advances to a different boss
- **THEN** the exact readiness results are replaced with that boss's authored recommendations

### Requirement: Exact readiness is deterministic and non-scored

For each recommendation the system SHALL compare the five exact `heroIds` with owned roster character ids and SHALL report each hero as owned or missing. Readiness SHALL be:

- `Ready` when all five exact heroes are owned;
- `Partial` when one to four exact heroes are owned;
- `Unavailable` when none of the five exact heroes are owned.

Machine-of-War ownership SHALL be reported separately as owned or missing and SHALL NOT change the hero readiness classification. The system SHALL NOT infer a replacement from Comp membership or another recommendation and SHALL NOT calculate effectiveness, damage, synergy, or a readiness score.

#### Scenario: Exact team is owned

- **WHEN** the current player's roster contains all five exact hero ids
- **THEN** the recommendation is Ready and its Machine-of-War ownership is shown separately

#### Scenario: Some exact heroes are missing

- **WHEN** the roster contains three of the five exact hero ids
- **THEN** the recommendation is Partial with the three owned and two missing heroes identified

#### Scenario: No exact heroes are owned

- **WHEN** the roster contains none of the five exact hero ids
- **THEN** the recommendation is Unavailable without suggested replacements

### Requirement: Ideal Meta teams and roster gaps are presented together

Each recommendation card SHALL show whether it is Meta or alternate, the exact five heroes, recommended Machine of War, referenced Comp signatures, readiness classification, owned/missing state per unit, and the catalog source/update attribution. Available player investment facts MAY be shown per owned unit, but SHALL NOT be compared with an invented minimum or used to reorder recommendations.

At or above 768px the exact lineup and readiness summary SHALL remain visible together in a horizontal/card layout. Below 768px the readiness summary SHALL precede a compact lineup and expandable Comp/source detail without horizontal scrolling.

#### Scenario: Desktop recommendation is compared at a glance

- **WHEN** exact readiness is viewed at or above 768px
- **THEN** the lineup and its owned/missing summary are visible together

#### Scenario: Mobile recommendation prioritizes readiness

- **WHEN** exact readiness is viewed below 768px
- **THEN** classification and missing-unit summary appear before expandable secondary details

### Requirement: Meta and roster absence states remain distinct

The system SHALL distinguish an absent local Meta dataset, a valid Meta dataset with no group for the active boss, an unavailable current-player roster, and valid recommendations for which no team is Ready. Guild status SHALL remain visible in every one of these states.

#### Scenario: Meta data has not synchronized

- **WHEN** no local Guild Raid Meta record exists
- **THEN** the recommendation region asks for catalog synchronization and does not describe the boss as unsupported

#### Scenario: Boss has no published Meta

- **WHEN** the Meta dataset is present but contains no group for the active boss
- **THEN** the region states that no curated recommendation is available for that boss

#### Scenario: Player roster is unavailable

- **WHEN** recommendations exist but the current player's roster data is absent
- **THEN** ideal lineups remain visible, readiness is withheld, and the user is prompted to synchronize player data

#### Scenario: No exact team is ready

- **WHEN** recommendations and roster exist but each result is Partial or Unavailable
- **THEN** the page presents the gaps without claiming that no Meta data exists or inventing a playable variant
