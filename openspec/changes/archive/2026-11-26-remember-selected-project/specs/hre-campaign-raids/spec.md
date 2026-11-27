## MODIFIED Requirements

### Requirement: The HRE tab has raid list controls

The HRE tab's toolbar SHALL show the Dailies project selector (with "All projects") and the Raids Filters action while the event is running or previewed, and SHALL NOT show the Planning Settings action. The project selection SHALL be the shared, remembered one (see `goals-navigation`). The suggestions SHALL serve the selected project's Active goals first (every Active goal without one), SHALL use the persisted Raids Filters (except the campaign-type filter, as before) and the Planning Settings daily energy set on Today, and the empty-list action to reset the filters SHALL remain. A past event SHALL NOT show the controls, the folds or the Campaign battles section.

#### Scenario: Controls in the toolbar

- **GIVEN** an HRE is running
- **THEN** the toolbar shows the project selector and the Raids Filters action, and no Planning Settings action

#### Scenario: Project picked on Today

- **GIVEN** a project is selected on Today
- **THEN** the HRE suggestions rank nodes that feed that project's goals first
