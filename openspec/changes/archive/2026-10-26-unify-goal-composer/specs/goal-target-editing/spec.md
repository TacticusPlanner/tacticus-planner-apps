# Spec Delta

## ADDED Requirements

### Requirement: Rank and Ascension targets are picked on a ladder

In the create and Edit goal dialogs, Rank and Ascension targets SHALL be chosen on a ladder that shows every step of the unit's track, grouped by tier. The goal's start step SHALL be marked "Current". The selected target SHALL be marked, and the steps from start to target SHALL be highlighted. Rank's additional target SHALL stay a separate control under the ladder.

#### Scenario: Incisus Rank ladder

- **GIVEN** Incisus is Gold II and the Rank target is Diamond II
- **WHEN** the Rank card is open
- **THEN** Gold II is marked Current, Diamond II is marked selected, and Gold II to Diamond II is highlighted

#### Scenario: Stored target at or below start

- **GIVEN** an imported goal whose stored target is at or below its start
- **WHEN** the Edit goal dialog opens
- **THEN** that stored step is shown as selected, together with the below-range message

### Requirement: Ladder steps that cannot be targets are not selectable

On the ladder, steps at or below the goal's start SHALL NOT be selectable. Steps that another in-flight goal of the same kind and unit already targets SHALL NOT be selectable and SHALL be marked "Already a goal".

#### Scenario: Taken steps

- **GIVEN** Incisus is Gold II and has in-flight Rank goals targeting Gold III and Diamond I
- **WHEN** the Rank card is open
- **THEN** Silver III, Gold II, Gold III and Diamond I cannot be selected, and Gold III and Diamond I are marked "Already a goal"

### Requirement: The ladder is keyboard and touch operable

Each ladder step SHALL have an accessible name with its step name and state. Arrow keys SHALL move between selectable steps, and Enter or Space SHALL select. At 768px or wider all tiers SHALL show without scrolling. Below 768px the tiers SHALL wrap onto several rows and each step's hit area SHALL be at least 44px tall.

#### Scenario: Keyboard selection

- **GIVEN** focus is on the selected step Diamond II
- **WHEN** the user presses the right arrow and then Enter
- **THEN** Diamond III is selected

#### Scenario: Desktop layout

- **WHEN** the ladder is shown at 1280px
- **THEN** every tier is visible without scrolling

#### Scenario: Mobile layout

- **WHEN** the ladder is shown at 390px
- **THEN** the tiers wrap onto several rows and each step is at least 44px tall

### Requirement: The selected target range shows its cost

Beside the ladder, the card SHALL state the selected range ("Gold II → Diamond II") and the resources it needs, from the same preview result as the card's estimate. While that preview is loading or has failed, it SHALL say so.

#### Scenario: Range changes

- **WHEN** the user moves the Rank target from Diamond II to Diamond III
- **THEN** the stated range and its resources update to Gold II → Diamond III

### Requirement: Ability levels use a stepper

In the create and Edit goal dialogs, each ability track's target level SHALL be set with a number stepper (decrease, value, increase), ranging from the start (no change on that track) to 60, the highest ability level of any rarity. A typed value outside the range SHALL show the range message.

#### Scenario: Decrease stops at start

- **GIVEN** the start is 35 and the target is 35
- **THEN** the decrease control is unavailable and the value reads as no change

### Requirement: An Ability goal raises at least one track

An Ability goal SHALL be valid when at least one track rises above its start; a track left at its start is not changed. When neither track rises, the card SHALL show the no-change message. A target above the unit's current rarity cap SHALL keep the existing above-cap behaviour, including the Ascension prerequisite suggestion.

#### Scenario: Raise one track only

- **GIVEN** active and passive are both at 35
- **WHEN** the user raises active to 40 and leaves passive at 35
- **THEN** the goal is valid and targets active 40 only

#### Scenario: Neither track raised

- **WHEN** both tracks are at their start
- **THEN** the card shows the no-change message and creation or saving is unavailable

### Requirement: Ability steppers offer quick picks

Each ability stepper SHALL offer "Next" (start + 1), "+5" (start + 5, capped at 60), and "Rarity cap" (the ability cap of the unit's current rarity). "Rarity cap" SHALL be hidden when the start is at or above that cap.

#### Scenario: Quick picks for a Legendary unit at 35

- **GIVEN** the active ability is at 35 and the unit is Legendary, with cap 50
- **WHEN** the user activates "Next", then "+5", then "Rarity cap"
- **THEN** the target becomes 36, then 40, then 50

#### Scenario: At the rarity cap

- **GIVEN** a Legendary unit whose active ability is at 50
- **THEN** "Rarity cap" is not offered and "Next" sets 51
