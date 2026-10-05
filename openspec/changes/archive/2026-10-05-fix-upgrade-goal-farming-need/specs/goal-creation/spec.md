## ADDED Requirements

### Requirement: An Upgrade goal persists the range it was created against

When a user creates an Upgrade goal for a Character, the create sheet SHALL send the rank range
selected on the Upgrade card with the goal. For a Machine of War, the Upgrade card SHALL offer an
independent start/end level selector per ability track, each optionally left unset; the set tracks
SHALL be sent with the goal, and the offered materials and their prefilled quantities SHALL cover
only the set tracks (the whole ladder when neither is set). The selectors SHALL use the same
layout on desktop (dialog) and mobile (sheet).

#### Scenario: Character range is sent

- **WHEN** a user creates an Upgrade goal for Incisus with the rank range Stone2→Stone4
- **THEN** the created goal stores that rank range

#### Scenario: Machine of War with one track

- **WHEN** a user sets only the primary track to levels 1→5 on a Machine of War
- **THEN** the offered materials come from the primary track's rows 1→5, and the created goal
  stores the primary range and no secondary range

#### Scenario: Machine of War with no track set

- **WHEN** a user sets neither track
- **THEN** the card offers the whole ladder as today and the goal is created without a range
