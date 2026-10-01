## ADDED Requirements

### Requirement: The HSE tab shows a live indicator while an event is active

The HSE tab SHALL show the shared live indicator (see `app-navigation` "Navigation shows a live indicator for an active Home Screen Event") while any HSE is active, in the section tab row on mobile and in the desktop section menu, and none otherwise. It does not change the tab's label, route, order or visibility.

#### Scenario: Indicator on the tab while live

- **GIVEN** an HSE is active
- **WHEN** the user views Dailies on desktop or mobile
- **THEN** the HSE tab shows the indicator with the accessible text "event live", and the tab remains in its position after Raids

#### Scenario: No indicator while idle

- **GIVEN** no HSE is active
- **THEN** the HSE tab is shown without an indicator and still opens its empty state
