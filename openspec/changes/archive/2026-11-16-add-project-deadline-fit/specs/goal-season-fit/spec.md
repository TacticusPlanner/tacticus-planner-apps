# Spec Delta

## MODIFIED Requirements

### Requirement: Season fit is a Goals view option

The Goals page SHALL offer a **Season fit** select with the options Off, Battle Pass, Guild Raid and Guild War, defaulting to Off. The choice SHALL be persisted per browser and SHALL survive navigating away and a reload. The same choice SHALL apply on the unscoped Goals page and when Goals is scoped to a project without a target (`?project=`); changing scope SHALL NOT reset it. When Goals is scoped to a project with a target, the select SHALL be replaced by a read-only "Using project deadline" chip, the project's deadline fit (`project-deadline-fit`) SHALL apply instead, and the stored choice SHALL be kept and apply again when the scope changes. It SHALL NOT be URL state and SHALL NOT affect Dailies, Schedule or Insights.

On desktop the select (or the chip) SHALL sit in the filters row after the Type and Group filters. On mobile it SHALL sit in the second control row as an icon-only trigger with an accessible name, like the other compressed filters.

#### Scenario: Choice survives reload and scope change

- **GIVEN** the user set Season fit to Battle Pass on `/plan/goals`
- **WHEN** they open an untargeted project's goals (`/plan/goals?project={id}`) and then reload
- **THEN** Season fit still reads Battle Pass and the project's goals show fit labels

#### Scenario: A targeted project overrides the select

- **GIVEN** Season fit is Battle Pass
- **WHEN** the user opens the goals of a project targeting Guild War season 29
- **THEN** the select is replaced by "Using project deadline", the goals show project deadline fits, and returning to `/plan/goals` shows Battle Pass again

#### Scenario: Off shows nothing

- **WHEN** Season fit is Off and the scope has no project target
- **THEN** no fit label, accent or divider is rendered and the list matches today's Goals page

#### Scenario: Mobile control

- **WHEN** the Goals page renders below 768px
- **THEN** the Season fit trigger is an icon button named "Season fit" in the second control row, and choosing a mode from it updates the cards
