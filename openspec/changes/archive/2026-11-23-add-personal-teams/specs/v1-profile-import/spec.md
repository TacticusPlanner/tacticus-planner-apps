## MODIFIED Requirements

### Requirement: The import dialog takes V1 credentials and a part selection

The dialog SHALL accept a V1 username and password and SHALL let the user
choose which parts of the V1 profile to import. The selectable parts SHALL
include **Legendary Event teams** (the API's `legendaryEventPlans` part),
described as importing hand-built teams, notes, per-run mission and pack
inputs, and Maybe clear / Stop here marks for events the planner currently
knows, and not progress. The selectable parts SHALL also include **Teams** (the
API's `teams` part), described as importing the teams from V1's Teams page,
up to 20, and keeping any Teams already in the planner, and not V1's War Defense
or War Offense plans. V1
credentials SHALL be used for the import only and SHALL NOT be retained after
the dialog closes.

#### Scenario: Reopening the dialog presents empty credentials

- **GIVEN** the user submitted an import and closed the dialog
- **WHEN** the dialog is reopened
- **THEN** the password field is empty

#### Scenario: No part selected prevents submission

- **WHEN** the user clears every part from the selection
- **THEN** the dialog's submit control is unavailable

#### Scenario: Legendary Event teams is a selectable part

- **WHEN** the dialog opens from the account page or from onboarding
- **THEN** a "Legendary Event teams" part is listed with the other parts, unchecked on the account page and checked in onboarding, and its description mentions run inputs and marks

#### Scenario: Teams is a selectable part

- **WHEN** the dialog opens from the account page or from onboarding
- **THEN** a "Teams" part is listed after "Legendary Event teams", unchecked on the account page and checked in onboarding, and its description says existing teams are kept

## ADDED Requirements

### Requirement: Team import outcomes are reported per team

When the Teams part was selected, the result SHALL list one outcome per V1 team in the same four buckets as goals: **imported** (the team name), **needed no import** (code `already_imported`, the V1 team was imported before, even if it has since been renamed; and code `duplicate_name`, a team made in the planner already has that name), **not imported** (codes `team_limit_reached` and `no_units`), and **failed** (code `invalid_team`). Each team's issues SHALL be listed under it with a translated reason and the value concerned, never as raw codes: a unit or campaign that was not recognised, a repeated unit kept once, a flex section dropped because V1 had no core characters before it, a shortened name or notes, and each team rule the imported team breaks, with a note that it can be fixed on the Teams page. The part's own row SHALL carry a translated reason for `missing_teams`, `invalid_teams`, `teams_skipped` and `team_import_failed`. After an import with the part selected, the Teams views SHALL refresh.

#### Scenario: Imported team lists its issues

- **GIVEN** "Horde core" was imported with two characters, one unit was unknown, and the team breaks `tooFewCharacters`
- **WHEN** the result is shown
- **THEN** the imported bucket lists "Horde core" with one line naming the unrecognised V1 value, one line saying a team needs at least 3 characters, and a link to the Teams page

#### Scenario: Re-run

- **GIVEN** every V1 team was imported before, and one has since been renamed
- **WHEN** the result is shown
- **THEN** every team, including the renamed one, is in the needed-no-import bucket with the already-imported reason, and the part's row explains that no new team was imported

#### Scenario: Name taken by a planner team

- **GIVEN** the player made a team "Horde" in the planner, and V1 has a team "horde" never imported
- **WHEN** the result is shown
- **THEN** "horde" is in the needed-no-import bucket with a reason saying a team with that name already exists

#### Scenario: Teams limit

- **GIVEN** 2 teams were skipped with `team_limit_reached`
- **WHEN** the result is shown
- **THEN** both are in the not-imported bucket with a reason naming the limit of 20

#### Scenario: Teams page refreshes

- **GIVEN** the Teams page data is cached
- **WHEN** an import with Teams selected completes
- **THEN** the Teams page shows the imported teams without a reload
