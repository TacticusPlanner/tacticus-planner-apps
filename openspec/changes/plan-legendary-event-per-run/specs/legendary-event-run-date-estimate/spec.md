## ADDED Requirements

### Requirement: Unannounced runs get a guessed start for display

Each run without an announced start SHALL also get a **guessed** start: the previous run's start (announced or guessed) + **175 days**, the usual gap between runs (recent run-1-to-run-3 cycles took 350 days), and never before the run's estimated start. An announced run's guess SHALL be its announced start. Without an announced run 1, no run SHALL have a guess. Wherever a run's date is shown to users, the guess SHALL be shown and labelled as a guess ("maybe"); the estimated (earliest) start SHALL stay the one that decides when a planned upgrade is ready for a run.

#### Scenario: Event with one announced run

- **GIVEN** Bile's only announced start is 8 November 2026
- **WHEN** its dates are computed
- **THEN** run 2 is guessed to start on 2 May 2027 and run 3 on 24 October 2027

#### Scenario: Uthar run 3

- **GIVEN** Uthar's runs 1 and 2 are announced for 8 March 2026 and 4 October 2026
- **WHEN** Uthar's dates are computed
- **THEN** run 3 is guessed to start on 28 March 2027 (its earliest estimate stays 21 February 2027)
