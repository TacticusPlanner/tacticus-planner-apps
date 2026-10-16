# Spec Delta

## ADDED Requirements

### Requirement: A team card shows what the same team cleared last run

When the event has a previous run (see `legendary-event-run-history`) whose teams snapshot contains a team with the same id on this lane, that team's card SHALL show "Last run: cleared up to battle N" beside its clear depth, with N the team cleared battle derived from the previous record. A team absent from the snapshot (created since) SHALL show no line. The line SHALL NOT change the depth stepper's value or default, and SHALL be absent while records load or when their read failed.

#### Scenario: Same team as last run

- **GIVEN** the previous run's snapshot has Alpha team "Melee" (same id) cleared up to battle 3
- **WHEN** the Alpha tab renders Melee's card
- **THEN** the card reads "Last run: cleared up to battle 3" beside the depth stepper, and the stepper still shows the current run's depth

#### Scenario: New team

- **GIVEN** a team created after the previous run
- **WHEN** its card renders
- **THEN** no last-run line is shown

#### Scenario: Mobile card

- **WHEN** the card renders below 768px
- **THEN** the last-run line wraps under the depth stepper instead of beside it
