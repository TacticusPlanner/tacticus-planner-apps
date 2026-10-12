# Spec Delta

## MODIFIED Requirements

### Requirement: Clear depth is a manual stepper per run

Each card and the editor SHALL expose the clear depth of the current run as a stepper bounded 1..(lane battle count) with a clear control that sets it to null. The current run SHALL be the synced `currentEventRun` for the event, or 1 when the account has no synced entry for it. Every depth write SHALL carry that run, so a depth set during another run is kept. Any value set by the user SHALL be stored with source `manual`. On the card, each stepper change SHALL show at once, and a rapid run of changes SHALL be sent as one write carrying the final value once the changes settle; a run that ends on the starting value SHALL send nothing. When the current run has no manual depth and a clear estimate exists (see `legendary-event-clear-estimates`), the stepper SHALL show the estimate marked "estimated" with its margin line ("N% above battle n · M% short of battle n+1"), and − or + SHALL start from the estimate and store a manual depth. When a manual depth exists and an estimate exists, the card SHALL show a muted "estimate ~n" hint and a **Use estimate** control that clears the current run's manual depth. An estimated depth of 0 SHALL read "Not enough for battle 1 yet". Members that are not owned SHALL be noted as not counted. The estimate SHALL never be written to the API; the `estimate` source is not used by this client. Every depth write SHALL report the estimate shown at the time (or none) with the analytics event.

#### Scenario: Depth set from the card

- **GIVEN** a team with no depth on an 18-battle lane and no estimate available
- **WHEN** the user presses + three times in quick succession
- **THEN** the card shows 1, 2 then 3 as they are pressed, and once the presses settle one write saves the team with `run` 1, `expectedBattleClears` 3 and source `manual`

#### Scenario: Depth is per run

- **GIVEN** a team with a run-1 depth of 7, the synced progress says the event is in run 2, and no estimate is available
- **WHEN** the card renders
- **THEN** it shows "Set depth", and setting 9 saves `run` 2 while the run-1 depth of 7 is still in the plan

#### Scenario: Depth cleared

- **WHEN** the user clears the depth and no estimate is available
- **THEN** the card shows "Set depth" and the team is saved with a null depth and null source for the current run

#### Scenario: Estimate shown without a manual depth

- **GIVEN** the worked Uthar Alpha team with an estimated depth of 6 and no manual depth for the current run
- **WHEN** the card renders
- **THEN** the stepper shows 6 marked "estimated" with "21% above battle 6 · 32% short of battle 7", and nothing is written

#### Scenario: Override from the estimate

- **GIVEN** that card
- **WHEN** the user presses + once
- **THEN** the card shows 7 without the "estimated" mark, one write saves `expectedBattleClears` 7 with source `manual`, and the analytics event carries `estimate` 6

#### Scenario: Use estimate

- **GIVEN** a team with a manual depth of 9 for the current run and an estimate of 6
- **WHEN** the user presses Use estimate
- **THEN** the current run's depth is saved as null and the card shows 6 marked "estimated"

#### Scenario: Roster change moves the estimate, not the manual value

- **GIVEN** a team with a manual depth of 7 and an estimate of 6
- **WHEN** a sync raises a member's rank so the estimate becomes 8
- **THEN** the card still shows 7, with the hint "estimate ~8", and no write happens
