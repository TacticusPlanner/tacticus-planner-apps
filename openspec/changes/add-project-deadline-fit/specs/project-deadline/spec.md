# project-deadline Specification

## ADDED Requirements

### Requirement: A Legendary Event target resolves to a run start

The client SHALL resolve a Legendary Event target to one UTC instant: the start of its run when the target names one, otherwise the start of the first run whose start is after now (next run). When that run is unannounced, it SHALL use the earliest estimate (`legendary-event-run-date-estimate`) and be marked estimated.

#### Scenario: Existing target without a run

- **GIVEN** now is 2026-11-03T22:00Z, a project targets `{ kind "legendaryEvent", eventId "votanUthar" }`, and Uthar's next run starts 2026-11-27T00:00Z
- **WHEN** the target is resolved
- **THEN** the deadline is 2026-11-27T00:00Z

#### Scenario: Announced run

- **GIVEN** the catalog announces `lostaBile` run 1 at 2026-11-08T00:00Z
- **WHEN** a target `{ eventId "lostaBile", run 1 }` is resolved
- **THEN** the deadline is 2026-11-08T00:00Z and it is not estimated

#### Scenario: Unannounced run

- **GIVEN** Uthar's run 3 is not announced and its earliest estimated start is 2027-03-02T00:00Z
- **WHEN** a target `{ eventId "votanUthar", run 3 }` is resolved
- **THEN** the deadline is 2027-03-02T00:00Z and it is estimated

### Requirement: A Legendary Event deadline can be loading, unavailable or ended

While the catalog loads, a Legendary Event target's deadline SHALL be loading. It SHALL be unavailable when the catalog does not serve the event or the run has no start. It SHALL be ended when its instant is at or before now; a target without a run is ended once run 3 has started. A target SHALL never change without a user action.

#### Scenario: Event left the catalog

- **GIVEN** a project targets an event the catalog no longer serves
- **WHEN** the target is resolved
- **THEN** the deadline is unavailable

#### Scenario: Next run after run 3

- **GIVEN** a project targets Uthar with no run, and Uthar's run 3 started yesterday
- **WHEN** the target is resolved
- **THEN** it is ended
