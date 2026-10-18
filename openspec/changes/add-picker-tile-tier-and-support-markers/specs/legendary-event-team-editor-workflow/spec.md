## ADDED Requirements

### Requirement: Picker tiles mark tier and support traits

Every picker tile SHALL show, in a column at its top-left corner (mirroring the reserve button), the character's horde-mode tier as a badge in that tier's colour when the tier list places it in a tier, and below it an icon for each of its Healer and Mechanic traits. Markers show for owned and locked units alike and carry screen-reader text. With no tier, the trait icons take the badge's place. While the tier list is unavailable, no badge shows.

#### Scenario: Tiered healer

- **GIVEN** a character in tier S with the Healer trait
- **WHEN** its tile renders
- **THEN** the top-left column shows an "S" badge in the S colour, announced as "Tier S", with the Healer icon below it

#### Scenario: Untiered mechanic

- **GIVEN** an untiered character with the Mechanic trait
- **WHEN** its tile renders
- **THEN** the top-left column shows only the Mechanic icon

#### Scenario: No markers

- **GIVEN** an untiered character with neither trait
- **WHEN** its tile renders
- **THEN** no marker column shows

#### Scenario: Locked unit

- **GIVEN** a locked character in tier A with the Healer trait
- **WHEN** its tile renders
- **THEN** it shows the "A" badge and the Healer icon
