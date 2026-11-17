## MODIFIED Requirements

### Requirement: Season fit is a Goals view option

The Goals page SHALL offer a **Season fit** select with the options Off, Battle Pass, Guild Raid and Guild War, defaulting to Off. The choice SHALL be persisted per browser, SHALL survive navigating away and a reload, and SHALL apply on the unscoped Goals page and in a project scope without a target (`?project=`). It SHALL NOT be URL state and SHALL NOT affect Dailies, Schedule or Insights.

In a project scope with a target, the select SHALL add a first option, **Project deadline**, chosen by default, which applies the project's deadline fit (`project-deadline-fit`). Choosing another option SHALL apply that mode instead and hide the deadline fit. This targeted choice SHALL be persisted per browser apart from the unscoped choice; changing either SHALL NOT change the other.

On desktop the select SHALL sit in the filters row after the Type and Group filters. On mobile it SHALL sit in the second control row as an icon-only trigger with an accessible name, like the other compressed filters.

#### Scenario: Choice survives reload and scope change

- **GIVEN** the user set Season fit to Battle Pass on `/plan/goals`
- **WHEN** they open an untargeted project's goals (`/plan/goals?project={id}`) and then reload
- **THEN** Season fit still reads Battle Pass and the project's goals show fit labels

#### Scenario: A targeted project overrides the select

- **GIVEN** Season fit is Battle Pass
- **WHEN** the user opens the goals of a project targeting Guild War season 29
- **THEN** the select reads Project deadline, the goals show project deadline fits, and returning to `/plan/goals` shows Battle Pass again

#### Scenario: A targeted project switches the deadline off

- **GIVEN** a targeted project's goals with Project deadline chosen
- **WHEN** the user picks Off in the Season fit select
- **THEN** no deadline header, fit label or divider is rendered, a reload keeps Off for targeted scopes, and the unscoped choice is unchanged

#### Scenario: Off shows nothing

- **WHEN** Season fit is Off and the scope has no project target
- **THEN** no fit label, accent or divider is rendered and the list matches today's Goals page

#### Scenario: Mobile control

- **WHEN** the Goals page renders below 768px
- **THEN** the Season fit trigger is an icon button named "Season fit" in the second control row, and choosing a mode from it updates the cards
