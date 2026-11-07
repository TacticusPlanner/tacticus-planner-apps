## ADDED Requirements

### Requirement: The HRE raids section has raid list controls

The HRE tab's raids section SHALL show, under its title, the Dailies project selector (with "All projects") and the Raids Filters action, and SHALL NOT show the Planning Settings action. The project selection SHALL be the one Dailies-wide, session-only selection shared with Today and the HSE tab. The suggestions SHALL serve the selected project's Active goals first (every Active goal without one), SHALL use the persisted Raids Filters (except the campaign-type filter, as before) and the Planning Settings daily energy set on Today, and the empty-list action to reset the filters SHALL remain. A past event SHALL NOT show the raids section.

#### Scenario: Controls in the raids section

- **GIVEN** an HRE is running
- **THEN** the raids section shows the project selector and the Raids Filters action, and the title row shows neither

#### Scenario: Project picked on Today

- **GIVEN** a project is selected on Today
- **THEN** the HRE suggestions rank nodes that feed that project's goals first

## REMOVED Requirements

### Requirement: The HRE tab has no raid header controls

**Reason**: Players asked to pick the project and Raids Filters next to the HRE raid suggestions.
**Migration**: See "The HRE raids section has raid list controls".
