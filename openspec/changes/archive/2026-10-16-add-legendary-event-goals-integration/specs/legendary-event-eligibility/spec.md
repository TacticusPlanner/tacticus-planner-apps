# Spec Delta

## ADDED Requirements

### Requirement: Leaderboard rows have an actions menu with Create goal

Every row of a lane leaderboard and of the Overview leaderboard SHALL have an actions menu opened from a three-dots button, on both forms. Its accessible name SHALL include the unit's localized name ("Actions for Tigurius"). Its first item, **Create goal**, SHALL open the shell's goal-creation sheet (see `goal-creation-entry-points`) as follows:

- a locked unit opens with the unit selected and goal type Unlock;
- an owned unit, or a unit whose ownership is unknown because the roster could not be read, opens with the unit selected and no goal type chosen.

Opening the menu SHALL NOT change the row's order, filters or the Goals Preview switch. The menu SHALL show the same items whatever the Goals Preview switch says, because ownership for Create goal is read from the synced roster.

#### Scenario: Create goal for an owned unit

- **GIVEN** Tigurius is owned
- **WHEN** the user opens his row's actions menu on the Alpha leaderboard and chooses Create goal
- **THEN** the goal-creation sheet opens with Tigurius selected and no goal type chosen

#### Scenario: Create goal for a locked unit

- **GIVEN** Certus is not owned and Goals Preview is on with an Active Unlock goal previewing him as owned
- **WHEN** the user chooses Create goal from his row's actions menu on Overview
- **THEN** the sheet opens with Certus selected and goal type Unlock

#### Scenario: Desktop menu

- **WHEN** a leaderboard renders at or above 768px
- **THEN** each table row ends with a three-dots button in a narrow trailing column whose header's accessible name is "Actions", and the table keeps no horizontal page scroll

#### Scenario: Mobile menu

- **WHEN** a leaderboard renders below 768px
- **THEN** each row card has a three-dots button in its top-right corner with a touch target of at least 44px, and opening it does not navigate or expand the card
