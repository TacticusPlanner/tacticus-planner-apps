# Spec Delta

## MODIFIED Requirements

### Requirement: Shop recommendations are a section of the Raids tab

The recommendations SHALL render as a "Shop recommendations" card in the Raids tab's (`/dailies/raids`) dashboard, below Bonus raids in the same column (see `daily-raids-today`, "Today lays out its sections as a dashboard"), in place of a separate Shops page. The card SHALL be shown whatever the raids' own state is (loading, load failure, nothing to farm, or ready), except that on one dashboard track (below 42rem of content, where it sits below Today's plan card) it SHALL wait while the raids are loading, so the plan arriving does not push it down the screen. It SHALL have no project selector of its own; its scope follows "Shops is a Dailies page defaulting to all goals with an optional project filter". Its subtitle SHALL name the selected project, or say that it covers every Active goal when none is selected. Shop names and their Guaranteed/Possible groups SHALL be headings nested under the card's own h2.

#### Scenario: Shops show while raids have nothing to farm

- **GIVEN** the raids show the nothing-to-farm state
- **AND** a daily shop offers a resource an Active goal still needs
- **THEN** the Shop recommendations card still shows that offer

#### Scenario: Shops show while raids are loading

- **GIVEN** Today's raid data is still loading
- **AND** the shop data has loaded with an offer an Active goal still needs
- **WHEN** the dashboard has two or four tracks
- **THEN** the Shop recommendations card shows that offer next to the loading Today's plan card

#### Scenario: Shops wait for the plan on one track

- **GIVEN** Today's raid data is still loading
- **WHEN** the dashboard has one track
- **THEN** the Shop recommendations card is not shown until the raids are no longer loading

#### Scenario: Shops move up when there are no bonus raids

- **GIVEN** there are no Bonus raids entries below the energy limit
- **WHEN** the dashboard renders with four tracks
- **THEN** the Shop recommendations card is at the top of the third track
