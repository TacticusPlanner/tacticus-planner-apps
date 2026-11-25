# project-deadline Specification

## Purpose

TBD - created by archiving change add-project-deadline-fit. Update Purpose after archive.

## Requirements

### Requirement: A Legendary Event target resolves to a run start

The client SHALL resolve a Legendary Event target to one UTC instant: the start of its run when the target names one, otherwise the start of the first run whose start is after now (next run). When that run is unannounced, it SHALL use the earliest estimate (`legendary-event-run-date-estimate`) and be marked estimated. The run SHALL also resolve its end, 7 days after its start, which `project-deadline-fit` measures goals finishing during the event against.

#### Scenario: Existing target without a run

- **GIVEN** now is 2026-11-03T22:00Z, a project targets `{ kind "legendaryEvent", eventId "votanUthar" }`, and Uthar's next run starts 2026-11-27T00:00Z
- **WHEN** the target is resolved
- **THEN** the deadline is 2026-11-27T00:00Z and the run ends 2026-12-04T00:00Z

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

### Requirement: A deadline shows as one chip with its timing

A project with a deadline SHALL show one deadline chip on its cards (Projects page and Home): the deadline's icon, then its name and timing, with the run's dates ("runs Dec 3 – Dec 10", "(estimated)" for an unannounced run) as a design-system tooltip. Timing uses the same countdown wording as Home's events: "starts in 18 days" before the deadline's start, "ends in 3 days" between its start and its end, "ended" after. A Legendary Event deadline reads "LE · Lysander · starts in 18 days" and links to the event page where the catalog serves it. The chip takes a small view model (kind, name, link, start, end, state), so a new deadline kind adds a mapper, not a new chip. A project without a deadline shows no chip; a deadline that is loading or unavailable shows the name alone.

#### Scenario: Upcoming run

- **GIVEN** a project targets Lysander, whose next run starts in 18 days
- **WHEN** its card renders
- **THEN** the chip reads "LE · Lysander · starts in 18 days"

#### Scenario: Running run

- **GIVEN** a project targets Lysander's run 2, which started 4 days ago
- **WHEN** its card renders
- **THEN** the chip reads "LE · Lysander · ends in 3 days"
