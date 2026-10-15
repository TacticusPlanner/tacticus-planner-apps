# Spec Delta

## ADDED Requirements

### Requirement: The Legendary Event page launches goal creation with the unit prefilled

The Legendary Event page SHALL launch the same goal-creation sheet the global entry points open, through the app shell's launcher. It does so from a leaderboard row's actions menu and from an Upgrade impact row. The launch SHALL prefill:

- **leaderboard row, owned or unknown ownership:** the unit, with no goal type chosen;
- **leaderboard row, locked unit:** the unit and goal type Unlock;
- **Upgrade impact Unlock step:** the unit and goal type Unlock;
- **Upgrade impact Ascension step:** the unit, goal type Ascension and the step's progression as the target;
- **Upgrade impact Rank step:** the unit, goal type Rank and the step's rank as the target rank, with 0 applied upgrades.

These launches carry no project context. The sheet SHALL therefore preselect membership exactly as for a launch with no project context (remembered membership when there is one, else the user's Default project). The user MAY change the unit, goal type, target or project before saving. After the goal is created, every goal read on the page SHALL refresh without a page reload.

#### Scenario: Ascension step prefill

- **WHEN** the user activates Create goal on an Upgrade impact row for Tigurius's Ascension to Epic:RedThreeStars
- **THEN** the sheet opens with Tigurius selected, goal type Ascension and target Epic:RedThreeStars, and the user's Default project preselected

#### Scenario: Rank step prefill

- **GIVEN** a unit owned at Silver2, Legendary:RedThreeStars, with a Rank step to Silver3 on an Upgrade impact row
- **WHEN** the user activates its Create goal
- **THEN** the sheet opens with that unit selected, goal type Rank and target rank Silver3 with 0 applied upgrades

#### Scenario: Unit-only prefill

- **WHEN** the user chooses Create goal from an owned unit's leaderboard row
- **THEN** the sheet opens with that unit selected and every goal type unticked, and the user chooses the goal type

#### Scenario: Prefill can be changed

- **GIVEN** the sheet opened from an Upgrade impact row with goal type Ascension
- **WHEN** the user switches the goal type to Rank and saves
- **THEN** a Rank goal is created and no Ascension goal is created
