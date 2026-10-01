## ADDED Requirements

### Requirement: Today is not event-optimised

Today (the Raids tab) SHALL build its schedule without any Home Screen Event scoring: the schedule SHALL be identical whether or not an HSE is active, and Today SHALL NOT show an event status line, upcoming-event notice, event-points figure or event switch. Event-point optimisation lives only on the HSE tab (`daily-raids-home-screen-event`).

#### Scenario: Active event does not change Today

- **GIVEN** Machine Hunt is active
- **THEN** Today's schedule and ordering equal the schedule with no active event, and no event UI is shown on Today
