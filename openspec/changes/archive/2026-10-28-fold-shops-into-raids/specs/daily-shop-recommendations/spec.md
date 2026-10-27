## ADDED Requirements

### Requirement: Shop recommendations are a section of the Raids tab

The recommendations SHALL render as a "Shop recommendations" section on the Raids tab (`/dailies/raids`), after the raid lanes, in place of a separate Shops page. The section SHALL be shown whatever the raids' own state is (loading, nothing to farm, or ready). It SHALL have no project selector of its own: it reads the Dailies project that the Raids tab's selector sets, so one selection narrows both the raids and the shop buys. Its subtitle SHALL name the selected project, or say that it covers every Active goal when none is selected. Shop names and their Guaranteed/Possible groups SHALL be headings nested under the section's own h2.

#### Scenario: One selector narrows raids and shops

- **WHEN** the user picks a project in the Raids tab's project selector
- **THEN** both the raid lanes and the shop recommendations reflect that project's goals

#### Scenario: Shops show while raids have nothing to farm

- **GIVEN** the raids show the nothing-to-farm state
- **AND** a daily shop offers a resource an Active goal still needs
- **THEN** the shop recommendations section still shows that offer

### Requirement: The Today tour covers the shop section

The Today tour on the Raids tab SHALL end with the shop recommendation steps, covering the section's purpose (shop recommendations for the selected project), the guaranteed-vs-possible distinction, and how a card's cost/needed-by detail is read. Their titles and content SHALL come from the `shops` namespace's existing `tour.shops.steps.*` keys. Desktop and mobile step sets SHALL both include them.

#### Scenario: Tour covers the shop section

- **WHEN** a signed-in user triggers the onboarding tour on the Raids tab
- **THEN** after the raid steps, the tour runs against the shop recommendations section with localized step content, for the current viewport's step set

## MODIFIED Requirements

### Requirement: Shops is a Dailies page defaulting to all goals with an optional project filter

The shop recommendations section on the Raids tab SHALL compute its recommendations from all of the player's Active goals in global priority order by default. The shared Dailies project selector SHALL act as an optional filter: while a project is selected, only that project's goals contribute; clearing it ("All goals") restores the default. The shop needs SHALL be derived from the same account-wide allocation as Today, then filtered to the selection, so selecting a project never re-runs an alternate project-only allocation.

#### Scenario: Shops uses the Dailies selected project

- **WHEN** a project is selected in the Dailies area and the user opens Raids
- **THEN** the shop recommendations reflect that project's goals

#### Scenario: Switching project recomputes recommendations

- **WHEN** the user changes the selected project on Raids
- **THEN** every shop's recommendations and the empty state are recomputed for the newly-selected project

#### Scenario: Default scope is all goals

- **WHEN** Raids loads and no project has been selected this session
- **THEN** the shop recommendations cover all Active goals without requiring the user to pick a project

## REMOVED Requirements

### Requirement: Shops page has an onboarding tour

**Reason**: The Shops page is folded into the Raids tab, so it has no tour of its own.

**Migration**: Replaced by "The Today tour covers the shop section".
