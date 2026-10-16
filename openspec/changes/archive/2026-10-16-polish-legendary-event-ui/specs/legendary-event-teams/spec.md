# Spec Delta

## ADDED Requirements

### Requirement: A team shows a readable name wherever it is named

A team whose stored name is empty or equals its lane id (case-insensitive, such as the "alpha" a V1 import stored) SHALL be shown by its covered objective labels joined by " · ", or "Team N" (its 1-based position in the lane) when it covers none; any other stored name is shown as stored. This display name SHALL be used on the team card, the token plan, the Next token card and its prompts, upgrade-impact rows and the last-run team lines.

#### Scenario: Imported team named after its lane

- **GIVEN** Uthar Alpha holds a team stored as "alpha" covering Max 2 Hits and Melee
- **WHEN** its card renders and a depth prompt names it
- **THEN** the card title reads "Max 2 hits · Melee" and the prompt reads "Set how far Max 2 hits · Melee clears"

#### Scenario: A chosen name is kept

- **GIVEN** a team stored as "Melee rush"
- **WHEN** it is shown anywhere
- **THEN** it reads "Melee rush"

#### Scenario: No objectives

- **GIVEN** the second Alpha team is stored as "alpha" and covers no objective
- **WHEN** it is shown
- **THEN** it reads "Team 2"

### Requirement: Editing a team named after its lane offers the readable name

Opening the editor on a team whose stored name is empty or equals its lane id SHALL prefill the name field with its display name. Saving then stores that name; the stored name is never changed by display alone.

#### Scenario: Edit and save

- **GIVEN** Uthar Alpha's team stored as "alpha" covering Max 2 Hits and Melee
- **WHEN** the user opens it in the editor and saves without touching the name
- **THEN** the name field showed "Max 2 hits · Melee" and the team is saved with that name

#### Scenario: Display alone changes nothing stored

- **WHEN** the team card renders the display name
- **THEN** no write is sent and the stored name stays "alpha"
