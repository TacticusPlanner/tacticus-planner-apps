## ADDED Requirements

### Requirement: Library unit pages launch goal creation with the unit prefilled

The Library character page and Machine of War page SHALL show a labeled **Create goal** button in the unit header for a signed-in player, at every width. Its accessible name SHALL name the unit ("Create goal for {name}"). Activating it SHALL launch the same goal-creation sheet the global entry points open, through the app shell's launcher, prefilled with:

- **a unit the synced roster doesn't hold:** the unit and goal type Unlock;
- **an owned unit, or a signed-in player whose roster hasn't synced:** the unit, with no goal type chosen.

The launch carries no project context, so the sheet preselects membership exactly as for a launch with no project context. The sheet's own rules then apply (for example an existing Unlock goal disables Unlock). While the signed-in player's data is still read the button SHALL be disabled, so a locked unit never opens without its Unlock prefill. A signed-out visitor SHALL NOT see the button. Each launch SHALL report `library_unit_create_goal_opened` with the entity type (`Character` or `Mow`) and the preselected goal type (`Unlock` or null), and nothing else.

#### Scenario: Owned character

- **GIVEN** a signed-in player who owns Tigurius
- **WHEN** they press Create goal on Tigurius's page
- **THEN** the creation sheet opens with Tigurius selected and no goal type ticked

#### Scenario: Locked Machine of War

- **GIVEN** a signed-in, synced player who doesn't own a Machine of War
- **WHEN** they press Create goal on that Machine of War's page
- **THEN** the creation sheet opens with that Machine of War and Unlock selected

#### Scenario: Signed out

- **WHEN** a signed-out visitor opens a Library unit page
- **THEN** no Create goal button is shown

#### Scenario: Player data still loading

- **GIVEN** a signed-in player whose roster is still being read
- **WHEN** the unit header renders
- **THEN** Create goal is shown disabled
