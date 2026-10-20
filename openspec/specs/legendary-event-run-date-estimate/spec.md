# legendary-event-run-date-estimate Specification

## Purpose

Defines how unannounced Legendary Event run starts and the event deadline (the end of run 3) are estimated from the LRE history, at the earliest the history allows so plans stay in time if runs come early.

## Requirements

### Requirement: Unannounced runs get an estimated start

The planner SHALL estimate each run without an announced start (`eventStageStartDatesUtc`) at the previous run's start (announced or estimated) + **140 days**, the minimum gap between consecutive runs since Kharn (one 105-day outlier aside). Run 3's estimate SHALL be no sooner than run 1's start + **315 days**, the shortest run-1-to-run-3 cycle since Kharn (recent cycles took 350 days). The event's **deadline** SHALL be run 3's start (announced or estimated) + 7 days. Without an announced run 1, unannounced runs SHALL have no estimate and the deadline SHALL be unknown. Estimates SHALL be labelled as estimated wherever shown.

#### Scenario: Uthar run 3

- **GIVEN** Uthar's runs 1 and 2 are announced for 8 March 2026 and 4 October 2026
- **WHEN** Uthar's dates are computed
- **THEN** run 3's estimated start is 21 February 2027 (run 2 + 140 days, later than run 1 + 315 days) and the deadline is 28 February 2027 (estimated)

#### Scenario: Event with one announced run

- **GIVEN** Bile's only announced start is 8 November 2026
- **WHEN** its dates are computed
- **THEN** run 2 is estimated to start on 28 March 2027 and run 3 on 19 September 2027 (run 1 + 315 days, later than run 2 + 140 days)

#### Scenario: No announced run

- **GIVEN** an event with no announced start
- **WHEN** its dates are computed
- **THEN** no run has an estimate and the deadline is unknown
