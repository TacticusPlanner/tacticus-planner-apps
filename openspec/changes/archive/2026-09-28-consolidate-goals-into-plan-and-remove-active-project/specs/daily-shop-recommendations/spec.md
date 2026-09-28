## REMOVED Requirements

### Requirement: Shops is a Dailies page scoped to the selected project

**Reason**: Shops defaults to all Active goals instead of the Active or Default project.

**Migration**: See the replacement requirement in this delta.

### Requirement: Loading, load-failure, no-project, and no-recommendation states are distinct

**Reason**: Shops defaults to all Active goals instead of the Active or Default project.

**Migration**: See the replacement requirement in this delta.

## ADDED Requirements

### Requirement: Shops is a Dailies page defaulting to all goals with an optional project filter

The Shops page SHALL render at `/dailies/shops` for a signed-in user and SHALL compute its
recommendations from all of the player's Active goals in global priority order by default. The
shared Dailies project selector SHALL act as an optional filter: while a project is selected, only that
project's goals contribute; clearing it ("All goals") restores the default. The shop needs SHALL be
derived from the same account-wide allocation as Today, then filtered to the selection, so
selecting a project never re-runs an alternate project-only allocation.

#### Scenario: Shops uses the Dailies selected project

- **WHEN** a project is selected in the Dailies area and the user opens Shops
- **THEN** the recommendations reflect that project's goals

#### Scenario: Switching project recomputes recommendations

- **WHEN** the user changes the selected project while on Shops
- **THEN** every shop's recommendations and the empty state are recomputed for the newly-selected project

#### Scenario: Default scope is all goals

- **WHEN** Shops loads and no project has been selected this session
- **THEN** it recommends against all Active goals without requiring the user to pick a project

### Requirement: Loading, load-failure, no-goals, and no-recommendation states are distinct

The page SHALL distinguish: still loading the project's goals or the shop data; a page-local failure
reading that data (with a retry affordance for the failed request, not presented as an empty result);
no Active goals in scope (prompting the user to create a goal or, when a project filter is set, to clear it); and a valid scope with
shop data where no shop offer matches an unmet need today (an explicit "nothing to buy today" empty
state). Total game-catalog sync failure is handled globally before the page mounts and is out of
scope for this page's own states.

#### Scenario: Loading

- **WHEN** the project's goals or the shop data are still loading
- **THEN** the page shows a loading state rather than an empty result

#### Scenario: Page-local load failure

- **WHEN** reading the project's goals or the shop data fails after the global catalog gate has passed
- **THEN** the page shows the failure with an action that retries the failed request, not an empty recommendation list

#### Scenario: No Active goals

- **WHEN** the player has no Active goals in scope (none at all, or none in the selected project)
- **THEN** the page shows an empty state prompting them to create a goal or clear the project filter, and shows no shop sections

#### Scenario: Nothing to buy today

- **WHEN** the Active goals in scope have needs but no daily shop offers any of those resources today
- **THEN** the page shows an explicit empty state indicating there is nothing worth buying today
