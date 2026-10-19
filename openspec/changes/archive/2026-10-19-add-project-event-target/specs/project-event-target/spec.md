# Spec Delta

## ADDED Requirements

### Requirement: A project can relate to a Legendary Event

A non-Default project SHALL carry an optional target `{ kind: "legendaryEvent", eventId }`, where `eventId` is a served `lres` id. The project form's **Related to** field SHALL offer None and each served Legendary Event (unit portrait and localized name, active and upcoming events first, then the rest by name). Saving SHALL send the target with the create or update call; choosing None SHALL send no target. The Default project's form SHALL NOT show Related to.

#### Scenario: Relate a new project to Uthar

- **WHEN** the user creates "Uthar run 3" with Related to set to Uthar
- **THEN** the create call carries `target { kind "legendaryEvent", eventId "votanUthar" }` and the new card shows the chip "LE · Uthar"

#### Scenario: Clear the target

- **GIVEN** a project related to Uthar
- **WHEN** the user edits it and picks None
- **THEN** the update carries no target and the chip disappears

#### Scenario: Default project

- **WHEN** the user edits the Default project
- **THEN** the form has no Related to field

### Requirement: Target chip links to the event

A project card with a target SHALL show the chip "LE · <unit name>" linking to `/legendary-events/<eventId>`. A target whose event the catalog no longer serves SHALL show "LE · <eventId>" without a link.

#### Scenario: Chip link

- **WHEN** the user activates "LE · Uthar" on a card
- **THEN** the app navigates to `/legendary-events/votanUthar`

### Requirement: The event Overview lists linked projects

The Legendary Event Overview SHALL show, for signed-in users, a **Projects** line listing the unarchived (active or paused) projects targeting the event ("Project: Uthar run 3 · 7 goals", each linking to that project on Goals), "+N archived" when archived ones exist, or "No project for this event" with a link to the Projects page. While projects load it SHALL show a one-line skeleton; when the read fails it SHALL be hidden.

#### Scenario: One linked project

- **GIVEN** the active project "Uthar run 3" targets Uthar and holds 7 goals
- **WHEN** Uthar's Overview renders
- **THEN** the line reads "Project: Uthar run 3 · 7 goals" and links to that project on Goals
