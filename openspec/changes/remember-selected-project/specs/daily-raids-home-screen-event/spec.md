## MODIFIED Requirements

### Requirement: The HSE tab has raid list controls

When the raid lists are shown, the HSE tab SHALL show, above them and not in the title row, the Dailies project selector (with "All projects") and the Raids Filters action. The project selection SHALL be the shared, remembered one (see `goals-navigation`), the same on Today and the HRE tab. The farm list SHALL follow the selected project; the top-10 lists SHALL stay goal-independent. Both lists SHALL follow the Raids Filters. The tab SHALL NOT show the Planning Settings action.

#### Scenario: Controls above the raid lists

- **GIVEN** a rule-bearing HSE is running
- **THEN** the project selector and Raids Filters show above the farm list and the top-10 lists, and no Planning Settings action is shown

#### Scenario: Project shared across Dailies tabs

- **GIVEN** a project is picked on the HSE tab
- **WHEN** the player opens Today
- **THEN** Today shows the same project selected
