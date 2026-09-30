## ADDED Requirements

### Requirement: Schedule is a Plan section page

The multi-day plan formerly presented as Dailies › Raids › Raids Plan SHALL be the Plan section's **Schedule** page at `/plan/schedule`, listed after Insights in the Plan section's child pages. `/dailies/raids/plan` SHALL NOT be a route. Wherever another spec says "Raids Plan", it means Schedule; the page's content, calculations, density toggle, day paging, and Raided split are unchanged by the move.

#### Scenario: Schedule is reachable from the Plan section

- **WHEN** the user opens the Plan section's child-page picker (mobile header tabs, desktop sidebar flyout, or navigation search)
- **THEN** Schedule is listed alongside Goals, Projects, and Insights, and activating it opens `/plan/schedule`

#### Scenario: The former sub-tab path is not a route

- **WHEN** the user opens `/dailies/raids/plan`
- **THEN** the app treats it as an unknown route, the same as any other path it does not serve

#### Scenario: Content is unchanged by the move

- **GIVEN** an account-wide plan that takes 5 days
- **WHEN** `/plan/schedule` renders
- **THEN** it shows the same whole-plan summary, day columns, density toggle, and Show all days behavior the page showed under Dailies

### Requirement: Schedule owns its project selection

Schedule SHALL provide its own project selector using the shared project-selector component, right-aligned in its own row with the Planning Settings trigger trailing after it. It SHALL default to "All goals" (the account-wide plan), SHALL NOT be persisted across a full page reload, and SHALL be independent of Today's selection, of every other Dailies page's selection, and of the Goals page's project scope. Selecting a project SHALL narrow the plan to that project's Active goals, still in canonical global priority order and from the one global run. A failed project-list load SHALL NOT be reported as a plan failure; with no projects the page SHALL derive its state from Active goals.

#### Scenario: Default is all goals

- **WHEN** Schedule loads with no prior selection this session
- **THEN** the selector reads "All goals" and the account-wide plan renders

#### Scenario: Selecting a project narrows the plan

- **WHEN** the user selects project B on Schedule
- **THEN** the summary and day columns recompute for project B's Active goals in global order

#### Scenario: Today is unaffected

- **GIVEN** project B is selected on Schedule
- **WHEN** the user opens Dailies › Raids
- **THEN** Today shows its own selection (All goals unless changed there), not project B

#### Scenario: Reload resets the selection

- **GIVEN** project B is selected on Schedule
- **WHEN** the user reloads `/plan/schedule`
- **THEN** "All goals" is selected again

#### Scenario: Project list fails to load

- **GIVEN** project-list loading fails but global goals load
- **WHEN** Schedule loads
- **THEN** it renders the account-wide plan and does not show a project-list error as a plan error

#### Scenario: No projects

- **GIVEN** no projects are available but global goals load
- **WHEN** Schedule loads
- **THEN** it derives its empty or populated state from Active goals, not project count

## REMOVED Requirements

### Requirement: Raids Plan shares Today's selected project

**Reason**: Schedule and Today are in different sections and no longer share a layout.
**Migration**: "Schedule owns its project selection" above; Today's selector is defined by `daily-raids-today` "Today's project selector defaults to all goals".
