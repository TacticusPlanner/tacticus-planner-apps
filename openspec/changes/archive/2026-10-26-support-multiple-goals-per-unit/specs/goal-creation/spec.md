## ADDED Requirements

### Requirement: The slot pre-check compares each goal's target

Before submission, the create sheet SHALL check each spec it would create against the account's in-flight goals of the same unit and type using that type's target key (`support-multiple-goals-per-unit` in the API). A conflict SHALL block submission and name the existing goal with its target. Unlock SHALL still conflict with any in-flight Unlock goal of the unit.

#### Scenario: A second Ascension with a new target is allowed

- **GIVEN** Ragnar has an in-flight Ascension goal ending at `Legendary:RedFiveStars`
- **WHEN** the user creates a Ragnar Ascension goal ending at `Mythic:OneBlueStar`
- **THEN** no conflict is shown and submission is allowed

#### Scenario: An equal target is blocked

- **GIVEN** Ragnar has an in-flight Ascension goal ending at `Legendary:RedFiveStars`
- **WHEN** the user sets up another ending at `Legendary:RedFiveStars`
- **THEN** submission is blocked with a message naming the existing goal and its target

### Requirement: The Ascension prerequisite suggestion reuses a covering existing goal

When a Rank or Ability target needs a higher progression than the unit has, the sheet SHALL first look for an in-flight Ascension goal of the unit that ends at or above the required progression. If one exists, the sheet SHALL NOT suggest a new Ascension goal. The review SHALL show that the new goal will depend on the existing one, and the submission SHALL declare it in `dependsOnGoalIds`.

#### Scenario: Ragnar's next Rank milestone with Ascension already planned

- **GIVEN** Ragnar is Epic with an in-flight Rank Diamond1 goal and an in-flight Ascension goal ending at a Legendary progression that permits Adamantine1
- **WHEN** the user creates a Ragnar Rank Adamantine1 goal
- **THEN** no Ascension suggestion is shown, the review states the goal depends on the existing Ascension goal, and submission succeeds

### Requirement: A too-low existing Ascension goal does not block a new suggestion

Only when no in-flight Ascension goal covers the need SHALL the sheet suggest a new Ascension goal from the current progression to the minimum required end. A lower existing Ascension goal SHALL NOT block that suggestion.

#### Scenario: Existing Ascension goal is too low

- **GIVEN** Ragnar is Rare with an in-flight Ascension goal ending at an Epic progression
- **WHEN** the user creates a Rank target that needs Legendary
- **THEN** a new Ascension goal to the minimum Legendary progression is suggested, the submission is not blocked by the Epic goal, and the Rank goal depends on the new Ascension goal

### Requirement: Rank, Ascension and Ability cards can add milestones

The Rank, Ascension and Ability cards SHALL offer "Add milestone", which appends another end target of the same type for the same unit. Each milestone's target SHALL be above the previous milestone's target, using the card's own validation. On submission, the sheet SHALL send one combined request with one spec per milestone in the listed order, each declaring a dependency on the previous milestone. A milestone SHALL be removable before submission.

#### Scenario: Ragnar's ladder in one submission

- **GIVEN** Ragnar is Legendary at Silver2
- **WHEN** the user adds Rank milestones Gold1, Diamond1, Diamond3 and Adamantine1 and submits
- **THEN** four Rank goals are created in that order with consecutive priorities, each depending on the previous

#### Scenario: Non-increasing milestone is invalid

- **WHEN** the user adds a milestone whose target is not above the previous one
- **THEN** submission is blocked with a message on that milestone

#### Scenario: A milestone conflicts with an existing goal

- **GIVEN** Ragnar already has an in-flight Rank Diamond1 goal
- **WHEN** the ladder includes Diamond1
- **THEN** submission is blocked, naming the existing Diamond1 goal, and the user can remove that milestone

### Requirement: A ladder places its Ascension prerequisite before the milestones that need it

Any Ascension prerequisite of a ladder SHALL precede the first milestone that needs it, and every milestone that needs it SHALL depend on it. The desktop dialog and mobile sheet SHALL show the same milestone list, stacked vertically.

#### Scenario: Ladder crossing a rarity cap

- **GIVEN** Ragnar is Epic and the ladder is Diamond1 then Adamantine1, where only Adamantine1 needs Legendary
- **WHEN** the user submits with the suggested Ascension goal
- **THEN** the order is Diamond1, Ascension, Adamantine1, and only Adamantine1 depends on the Ascension goal
