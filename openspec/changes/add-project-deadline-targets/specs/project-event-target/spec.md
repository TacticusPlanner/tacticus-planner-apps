# Spec Delta

## MODIFIED Requirements

### Requirement: A project can relate to a Legendary Event

A non-Default project SHALL carry an optional target. Its Legendary Event form is `{ kind: "legendaryEvent", eventId, run }`, where `eventId` is a served `lres` id and `run` is 1, 2, 3 or null ("next run"). The other kinds are defined in `project-deadline`. The project form's **Related to** field SHALL have two steps: first the kind (None, Legendary Event, Battle Pass, Guild Raid, Guild War, Date), then the detail for that kind. For Legendary Event the detail SHALL offer each served Legendary Event (unit portrait and localized name, active and upcoming events first, then the rest by name), followed by **Run**: Next run (the default), Run 1, Run 2, Run 3. Saving SHALL send the target with the create or update call. Choosing None SHALL send no target. The Default project's form SHALL NOT show Related to. A project stored with a Legendary Event target and no run SHALL read as Next run.

#### Scenario: Relate a new project to Uthar

- **WHEN** the user creates "Uthar run 3" with Related to set to Legendary Event, Uthar, Run 3
- **THEN** the create call carries `target { kind "legendaryEvent", eventId "votanUthar", run 3 }` and the new card shows the chip "LE · Uthar R3"

#### Scenario: Next run is the default

- **WHEN** the user picks Legendary Event and Uthar and leaves Run unchanged
- **THEN** the call carries `run null` and the chip reads "LE · Uthar (next run)"

#### Scenario: Clear the target

- **GIVEN** a project related to Uthar
- **WHEN** the user edits it and picks None
- **THEN** the update carries no target and the chip disappears

#### Scenario: Default project

- **WHEN** the user edits the Default project
- **THEN** the form has no Related to field

#### Scenario: Plan wizard stores its run

- **WHEN** the Legendary Event plan wizard creates a project for Bile run 1
- **THEN** the project's target is `{ kind "legendaryEvent", eventId "lostaBile", run 1 }`

### Requirement: Target chip links to the event

A project card with a Legendary Event target SHALL show the chip "LE · <unit name> R<run>", or "LE · <unit name> (next run)" when `run` is null, linking to `/legendary-events/<eventId>`. Its tooltip SHALL name the run's start date ("Run 3 starts Mar 2"), prefixed with "~" when that start is estimated. A target whose event the catalog no longer serves SHALL show "LE · <eventId>" without a link. Chips for the other kinds are defined in `project-deadline`.

#### Scenario: Chip link

- **WHEN** the user activates "LE · Uthar R3" on a card
- **THEN** the app navigates to `/legendary-events/votanUthar`

#### Scenario: Estimated run start

- **GIVEN** Uthar's run 3 is not announced and its earliest estimated start is 2027-03-02T00:00Z
- **WHEN** the user hovers or focuses the chip "LE · Uthar R3"
- **THEN** the tooltip reads "Run 3 starts ~Mar 2"
