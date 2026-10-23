# Spec Delta

## ADDED Requirements

### Requirement: The upgrade recommendation search runs in slices

The planner SHALL run the upgrade recommendation search in slices: after 8 ms a slice SHALL yield to the browser once its current candidate evaluation ends, and resume in a later task. The result SHALL equal an unsliced run's.

Assumptions:

- One evaluation takes ~2.3 ms on a desktop CPU (benchmark 2026-10-23, 68 owned units, three lanes).
- A farming estimate is not split, so an uncached chain can overrun the budget by one estimate.

#### Scenario: A round no longer blocks the page

- **GIVEN** a round of 170 candidate evaluations at 2.3 ms each (391 ms of work)
- **WHEN** the search runs that round
- **THEN** each slice runs four evaluations (after three, 6.9 ms is still under 8 ms; after four, 9.2 ms is over it), so the round runs as 43 tasks (170 ÷ 4 = 42.5, rounded up), none longer than 8 ms plus one evaluation (10.3 ms)

#### Scenario: Same result as an unsliced search

- **GIVEN** the Uthar plan fixtures
- **WHEN** the search runs once in slices and once to completion in one go
- **THEN** both give the same recommendation list (units, steps, gains, ready dates, first runs) and the same final ceiling

### Requirement: The search restarts only when its inputs change

The search SHALL restart only when the settled draft economy (see `legendary-event-plan-wizard`) changes; it runs on the default team adjustments, so Teams-step edits do not restart it. The planning inputs (catalog event, roster, stored plan, goal targets, unit power) SHALL be frozen when the wizard first has them all, so background refetches and late translation loads do not restart it. A roster sync while the wizard is open is picked up the next time the wizard is opened.

#### Scenario: A refetch does not restart the search

- **GIVEN** the search is in its third round
- **WHEN** the stored plan is refetched with unchanged data, or the character-name translations finish loading
- **THEN** the search continues from where it was and does not start again from round 1

### Requirement: A step's recommendations are final once they reach it

A step's recommendations (the prefix up to the first one whose ceiling reaches the step's target) SHALL be final as soon as that recommendation is found, and at once when the step is Reachable now, while the search carries on for the other steps. This holds because the search is greedy and a recommendation, once found, never changes.

#### Scenario: The target's recommendations are final before the search ends

- **GIVEN** the Unlock target of 10,000 points, a synced ceiling of 6,136, and a search whose first three recommendations bring the ceiling to 7,400, 9,100 and 10,450
- **WHEN** the third recommendation is found and the search continues looking for more
- **THEN** Unlock's recommendations are final: those three, with gains 1,264, 1,700 and 1,350 points (7,400 − 6,136; 9,100 − 7,400; 10,450 − 9,100)
- **AND** the steps above Unlock still wait for the search to end before their verdicts settle
