# Spec Delta

## MODIFIED Requirements

### Requirement: The import dialog takes V1 credentials and a part selection

The dialog SHALL accept a V1 username and password and SHALL let the user
choose which parts of the V1 profile to import. The selectable parts SHALL
include **Legendary Event teams** (the API's `legendaryEventPlans` part),
described as importing hand-built teams and notes for events the planner
currently knows, and not progress. V1 credentials SHALL be used for the import
only and SHALL NOT be retained after the dialog closes.

#### Scenario: Reopening the dialog presents empty credentials

- **GIVEN** the user submitted an import and closed the dialog
- **WHEN** the dialog is reopened
- **THEN** the password field is empty

#### Scenario: No part selected prevents submission

- **WHEN** the user clears every part from the selection
- **THEN** the dialog's submit control is unavailable

#### Scenario: Legendary Event teams is a selectable part

- **WHEN** the dialog opens from the account page or from onboarding
- **THEN** a "Legendary Event teams" part is listed with the other parts, unchecked on the account page and checked in onboarding

## ADDED Requirements

### Requirement: Legendary Event import outcomes are reported per event

When the Legendary Event teams part was selected, the result SHALL list one
outcome per V1 event in the same four buckets as goals: **imported** (event name
and the number of teams), **needed no import** (the plan already had teams),
**not imported** (the event is not in the planner's catalog), **failed**. An
event imported without a single kept team SHALL say so instead of reporting
teams imported, and SHALL show no team count. Each event's issues (a dropped
unit, a dropped objective, a skipped or merged team, existing planner notes kept
over the V1 notes, V1 notes shortened) SHALL be listed under that event with a translated reason and the value
concerned, and never as raw codes. The event name SHALL be the event unit's
localized name when the catalog knows it, otherwise the V1 event number. The
part's own row SHALL carry a translated reason, including when no event's teams
were imported because every event already had teams, is not in the catalog or
had no teams. After
an import with the part selected, the Legendary Event plan views SHALL refresh.

#### Scenario: Imported event lists its issues

- **GIVEN** Lysander imported two teams and one unit was unknown
- **WHEN** the result is shown
- **THEN** the imported bucket lists Lysander with "2 teams" and, beneath it, one line saying a unit was not recognised, naming the team and the V1 value

#### Scenario: Finished event is not imported

- **GIVEN** the V1 profile had teams for an event the catalog does not carry
- **WHEN** the result is shown
- **THEN** the not-imported bucket lists that event by its V1 number with the reason that the planner does not have that event yet

#### Scenario: Teams appear after import

- **GIVEN** the user had Lysander's page open in another tab
- **WHEN** the import completes with the part selected
- **THEN** the Teams section on that page shows the imported teams after its plan query refreshes

#### Scenario: Event imported without any team

- **GIVEN** every V1 team of Lysander was dropped as unknown units
- **WHEN** the result is shown
- **THEN** the imported bucket lists Lysander with no team count, a reason saying none of its teams could be kept, and issue lines for the dropped units and teams

#### Scenario: Existing notes are kept

- **GIVEN** the planner already had notes for Lysander and the V1 profile has notes for it too
- **WHEN** the result is shown
- **THEN** a line under Lysander says the planner's notes were kept and the V1 notes were not imported

#### Scenario: Nothing imported because every event was skipped

- **GIVEN** each V1 event already has teams in the planner or is not in the catalog
- **WHEN** the result is shown
- **THEN** the Legendary Event teams part row explains, in translated copy, that no event's teams were imported and why
