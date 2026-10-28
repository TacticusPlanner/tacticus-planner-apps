## MODIFIED Requirements

### Requirement: The slot pre-check compares each goal's target

Before submission, the create sheet SHALL check each spec it would create against the account's in-flight goals of the same unit and type using that type's target key (the API's per-target uniqueness rule). A conflict SHALL block submission and name the existing goal with its target. Unlock SHALL still conflict with any in-flight Unlock goal of the unit.

#### Scenario: A second Ascension with a new target is allowed

- **GIVEN** Ragnar has an in-flight Ascension goal ending at `Legendary:RedFiveStars`
- **WHEN** the user creates a Ragnar Ascension goal ending at `Mythic:OneBlueStar`
- **THEN** no conflict is shown and submission is allowed

#### Scenario: An equal target is blocked

- **GIVEN** Ragnar has an in-flight Ascension goal ending at `Legendary:RedFiveStars`
- **WHEN** the user sets up another ending at `Legendary:RedFiveStars`
- **THEN** submission is blocked with a message naming the existing goal and its target

### Requirement: Consecutive creation retains compatible context

During the current app session in one browser tab, the creation sheet SHALL offer the last successfully chosen project memberships and goal-type choices on a subsequent creation. These choices SHALL remain editable. The sheet SHALL NOT carry a previous unit's target levels, rank ranges, material quantities, or start-paused choice into a new goal. An explicit launch prefill, especially a viewed project's membership, SHALL take precedence over remembered values. A remembered goal type that is unavailable for the newly selected unit SHALL be left unselected.

#### Scenario: Reopen for a related goal

- **WHEN** the user completes a goal and reopens creation in the same app session without an explicit prefill
- **THEN** the last chosen project memberships are offered and compatible goal types can be reselected without carrying the old unit's target values

#### Scenario: Project-scoped launch wins

- **WHEN** the user launches creation from the Goals page scoped to a project after previously choosing different projects
- **THEN** the viewed project is preselected instead of remembered memberships

#### Scenario: Incompatible type is dropped

- **WHEN** a remembered Rank goal type is applied after the user chooses a Machine of War
- **THEN** Rank is not selected and no invalid target configuration is carried forward

#### Scenario: Remembered project no longer available

- **WHEN** a remembered project has since been archived or removed and creation is reopened without an explicit prefill
- **THEN** that project is not offered or submitted, and the user's Default project is preselected instead

#### Scenario: Session boundary

- **WHEN** the application is reloaded or a different browser tab starts a new session
- **THEN** remembered choices are cleared and ordinary default/prefill behavior applies

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
- **THEN** the card offers the whole ladder and the goal is created without a range
