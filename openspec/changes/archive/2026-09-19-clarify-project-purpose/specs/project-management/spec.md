## MODIFIED Requirements

### Requirement: The list route shows every project without its goal table

The dashboard SHALL show Current plan first, other non-archived projects separately, and archived projects in a subdued section collapsed by default when non-archived projects exist. It SHALL explain what a project is — a named, separately ordered selection of the account's goals — why an account may keep more than one, and that Current plan supplies the default context for Dailies and Insights. That explanation SHALL be visible on arrival at both breakpoints, not revealed only by hover, focus, or an opened menu. The dashboard SHALL NOT render a goal table.

#### Scenario: Current plan is immediately identifiable

- **GIVEN** one owned project is Current plan
- **WHEN** the dashboard renders
- **THEN** it appears first with a visible Current plan label and explanatory context

#### Scenario: Archived projects do not compete for focus

- **GIVEN** available and archived projects exist
- **WHEN** the dashboard initially renders
- **THEN** archived projects are grouped in a collapsed section

#### Scenario: All projects are visible without extra navigation

- **WHEN** the user opens the list route
- **THEN** every owned project remains available on the dashboard, including archived projects in their expandable section, and no goal table is rendered

#### Scenario: The dashboard says what a project is

- **GIVEN** the user has at least one project
- **WHEN** the dashboard renders
- **THEN** visible copy describes a project as a named selection of the user's goals with its own priority order, and describes what keeping more than one project is for

#### Scenario: The dashboard says what Current plan changes

- **WHEN** the dashboard renders its Current plan section
- **THEN** visible copy states that Current plan is the project Dailies and Insights use by default, and does not describe it as making goals active or inactive

#### Scenario: The explanation is not hidden behind an interaction

- **WHEN** the dashboard renders at either breakpoint
- **THEN** the project and Current plan explanations are readable without hovering, focusing, or opening any control

## ADDED Requirements

### Requirement: Project detail presents its goals as a selection of the account's goals

Project detail SHALL express how many goals the project contains relative to how many goals the account has, so that a project reads as a subset rather than as the whole goal list. Both numbers SHALL count the same set of goals — every goal that is not Archived — so that the project's number can never exceed the account's. Archived goals SHALL remain counted by the Archived status filter. When the account total is not yet known, the project's own count SHALL still render and SHALL NOT be presented against a guessed or zero total. When the project contains no goals, the empty state SHALL say that the project is empty rather than that the account has no goals, and SHALL point at the surfaces that fill it.

#### Scenario: A project's goal count is relative to the account

- **GIVEN** the account has 40 non-archived goals and the viewed project contains 12 of them
- **WHEN** project detail renders its summary
- **THEN** the summary conveys that the project holds 12 of the account's 40 goals

#### Scenario: Archived members are excluded from both sides

- **GIVEN** a project whose members are 12 non-archived goals and 6 archived ones, in an account with 40 non-archived goals
- **WHEN** project detail renders its summary
- **THEN** the summary reports 12 of 40, not 18 of 40, and the 6 archived goals remain counted by the Archived status filter

#### Scenario: The account total is still loading

- **GIVEN** the account's goal list has not loaded
- **WHEN** project detail renders its summary
- **THEN** the project's own goal count renders without an account total, and no total of zero is shown

#### Scenario: An empty project explains itself

- **GIVEN** the viewed project contains no goals while the account has goals elsewhere
- **WHEN** project detail renders
- **THEN** the empty state states that this project has no goals yet and identifies adding existing goals or creating a goal as the ways to fill it

#### Scenario: Membership is not described as activation

- **WHEN** project detail renders its summary and empty state
- **THEN** no copy states or implies that belonging to this project makes a goal active, or that leaving it makes a goal inactive
