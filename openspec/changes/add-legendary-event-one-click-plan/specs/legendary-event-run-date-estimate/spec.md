# Spec Delta

## ADDED Requirements

### Requirement: Unannounced runs get an estimated start

The planner SHALL compute the **run gap** as the median, rounded up to whole days, of the days between every pair of consecutive announced run starts (`eventStageStartDatesUtc`) across all served events. For an event, each run without an announced start SHALL get an estimated start of the previous run's start (announced or estimated) + the run gap. The event's **deadline** SHALL be run 3's start (announced or estimated) + 7 days. With no consecutive pair in the catalog, unannounced runs SHALL have no estimate and the deadline SHALL be unknown. Estimates SHALL be labelled as estimated wherever shown.

#### Scenario: Uthar run 3

- **GIVEN** the catalog's consecutive pairs are Uthar 8 March 2026 → 4 October 2026 (210 days) and Farsight 28 December 2025 → 21 June 2026 (175 days)
- **WHEN** Uthar's dates are computed
- **THEN** the run gap is 193 days (median 192.5, rounded up), run 3's estimated start is 15 April 2027 and the deadline is 22 April 2027 (estimated)

#### Scenario: Event with one announced run

- **GIVEN** Bile's only announced start is 8 November 2026 and the run gap is 193 days
- **WHEN** its dates are computed
- **THEN** run 2 is estimated to start on 20 May 2027 and run 3 193 days after that

#### Scenario: No history

- **GIVEN** no served event has two announced runs
- **WHEN** dates are computed for an event with one announced run
- **THEN** runs 2 and 3 have no estimate and the deadline is unknown
