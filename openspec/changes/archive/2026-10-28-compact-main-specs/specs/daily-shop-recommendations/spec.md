## MODIFIED Requirements

### Requirement: Shop recommendations are a section of the Raids tab

The recommendations SHALL render as a "Shop recommendations" section on the Raids tab (`/dailies/raids`), after the raid lanes, in place of a separate Shops page. The section SHALL be shown whatever the raids' own state is (loading, nothing to farm, or ready). It SHALL have no project selector of its own; its scope follows "Shops is a Dailies page defaulting to all goals with an optional project filter". Its subtitle SHALL name the selected project, or say that it covers every Active goal when none is selected. Shop names and their Guaranteed/Possible groups SHALL be headings nested under the section's own h2.

#### Scenario: Shops show while raids have nothing to farm

- **GIVEN** the raids show the nothing-to-farm state
- **AND** a daily shop offers a resource an Active goal still needs
- **THEN** the shop recommendations section still shows that offer
