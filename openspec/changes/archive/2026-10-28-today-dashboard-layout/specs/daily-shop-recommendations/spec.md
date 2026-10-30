## MODIFIED Requirements

### Requirement: Distinct desktop and mobile presentations

Shop recommendations SHALL use one compact presentation at every width: shop sections and recommendation cards composed as dense rows that minimize vertical space. The Raids tab is their only home and places them in a dashboard column about 400–575px wide (see `daily-raids-today`, "Today lays out its sections as a dashboard"), so a separate multi-column desktop layout no longer applies. Every label, count, cost, and control SHALL be present at every width.

#### Scenario: Mobile layout is compact

- **WHEN** shop recommendations are viewed below the 768px breakpoint
- **THEN** shop sections and recommendation cards are composed as dense rows that minimize vertical space while preserving every label, count, cost, and indicator

#### Scenario: Desktop layout uses available width

- **WHEN** shop recommendations are viewed at or above the 768px breakpoint
- **THEN** they use the same dense rows as on mobile, filling the width of the Shop recommendations card, with every label, count, cost, and indicator

### Requirement: Loading, load-failure, no-goals, and no-recommendation states are distinct

The page SHALL distinguish: still loading the project's goals or the shop data; a page-local failure
reading that data (with a retry affordance for the failed request, not presented as an empty result);
no Active goals in scope (prompting the user to create a goal or, when a project filter is set, to clear it); and a valid scope with
shop data where no shop offer matches an unmet need today (an explicit "nothing to buy today" empty
state). The nothing-to-buy state SHALL be one line of text inside the Shop recommendations card, not a card of its own. Total game-catalog sync failure is handled globally before the page mounts and is out of
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
- **THEN** the Shop recommendations card shows one line of text saying there is nothing worth buying today, with no further card or illustration

### Requirement: Shop recommendations are a section of the Raids tab

The recommendations SHALL render as a "Shop recommendations" card in the Raids tab's (`/dailies/raids`) dashboard, below Bonus raids in the same column (see `daily-raids-today`, "Today lays out its sections as a dashboard"), in place of a separate Shops page. The card SHALL be shown whatever the raids' own state is (loading, load failure, nothing to farm, or ready). It SHALL have no project selector of its own; its scope follows "Shops is a Dailies page defaulting to all goals with an optional project filter". Its subtitle SHALL name the selected project, or say that it covers every Active goal when none is selected. Shop names and their Guaranteed/Possible groups SHALL be headings nested under the card's own h2.

#### Scenario: Shops show while raids have nothing to farm

- **GIVEN** the raids show the nothing-to-farm state
- **AND** a daily shop offers a resource an Active goal still needs
- **THEN** the Shop recommendations card still shows that offer

#### Scenario: Shops show while raids are loading

- **GIVEN** Today's raid data is still loading
- **AND** the shop data has loaded with an offer an Active goal still needs
- **THEN** the Shop recommendations card shows that offer next to the loading Today's plan card

#### Scenario: Shops move up when there are no bonus raids

- **GIVEN** there are no Bonus raids entries below the energy limit
- **WHEN** the dashboard renders with four tracks
- **THEN** the Shop recommendations card is at the top of the third track
