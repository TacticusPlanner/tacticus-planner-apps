## ADDED Requirements

### Requirement: Filtered-out notice lists the skipped materials

Below its count sentences, Today's filtered-out notice SHALL list each material the applied Raids Filters left without an allowed node, once, in the order the plan first reports it (goal priority). Each row SHALL show the material's icon and name, the player's have/need over the run's goals, a **Pinned** badge when at least one goal pinned it to a location the filters exclude, and the icons of the goals waiting on it (every goal named in its accessible name and tooltip). The list SHALL show at most five materials, followed by a **Show all N** toggle that reveals the rest and then reads **Show less**. Beside **Reset filters** the notice SHALL link to Plan > Insights, whose results stay unfiltered.

#### Scenario: A material is filtered out

- **GIVEN** the filters remove every node of Ceramite, which goal g1 needs and the player holds 265 of 500
- **WHEN** Today is shown
- **THEN** the notice lists Ceramite with 265/500 and g1's icon, and links to Plan > Insights

#### Scenario: More than five materials

- **GIVEN** the filters leave seven materials without an allowed node
- **WHEN** Today is shown
- **THEN** the notice lists five, and **Show all 7** lists all seven

#### Scenario: Pinned material

- **GIVEN** a goal's pinned locations for a material all fail the filters
- **WHEN** Today is shown
- **THEN** that material's row carries a **Pinned** badge
