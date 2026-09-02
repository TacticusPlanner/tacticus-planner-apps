## ADDED Requirements

### Requirement: Today and Bonus Raids prioritize long-running resources

Within each goal group, Today and Bonus Raids SHALL order resources by the estimated time investment required to finish that resource: longest estimated completion time first, then greatest estimated energy cost. Configured goal priority SHALL remain the primary ordering between goal groups. Resources tied on both estimates SHALL use a stable deterministic ordering.

#### Scenario: A longer resource precedes a faster one in the same goal

- **GIVEN** two resources scheduled for the same goal and one has a longer estimated completion time than the other
- **WHEN** Today renders the goal group
- **THEN** the longer-running resource is shown first

#### Scenario: Energy breaks equal-time resource ties

- **GIVEN** two resources scheduled for the same goal with equal estimated completion times and different estimated energy costs
- **WHEN** Today renders the goal group
- **THEN** the resource with the greater estimated energy cost is shown first

#### Scenario: Bonus Raids retain urgency ordering within goal groups

- **GIVEN** two Bonus Raids resources belong to the same goal and have different urgency estimates
- **WHEN** Today renders the Bonus Raids group
- **THEN** they use the same time-investment ordering as the main schedule

#### Scenario: Goal priority remains the primary group ordering

- **GIVEN** a lower-priority goal has a resource that takes longer than a resource for a higher-priority goal
- **WHEN** Today renders the schedule or Bonus Raids
- **THEN** the higher-priority goal group remains before the lower-priority goal group

## MODIFIED Requirements

### Requirement: Today's Attempts section

Today SHALL show a "Today's Attempts" section after the Bonus Raids section, listing every standing (standard/mirror/elite/eliteMirror) campaign node the player has actually raided today — real synced attempts (`live-progress.battleAttempts[].attemptsUsed > 0`), account-wide, not scoped to the current project's schedule or Bonus Raids. Each listed location SHALL show its real numeric raid count today (`attemptsUsed`), including when its real synced attempts remaining are zero. Event-campaign nodes SHALL be excluded from this section for the same reason they're excluded from the real energy-usage total (see "Today shows real daily energy usage"): their `battleIndex` is ambiguous between Standard/Extremis tiers in the currently-stored data.

#### Scenario: An attempted location appears in Today's Attempts

- **GIVEN** the player has real synced attempts today at a standing-campaign node
- **WHEN** Today loads
- **THEN** that location appears in the Today's Attempts section, listed after Bonus Raids, showing its real raid count today

#### Scenario: An exhausted location shows a numeric actual count

- **GIVEN** a location listed in Today's Attempts has zero real attempts left today and a positive real number of attempts used
- **WHEN** Today loads
- **THEN** that location's entry shows the numeric attempts-used value and not "Max raids"

#### Scenario: Today's Attempts includes locations unrelated to the current project

- **GIVEN** the player has real synced attempts today at a standing-campaign node with no relevance to the current project's schedule or Bonus Raids
- **WHEN** Today loads
- **THEN** that location still appears in Today's Attempts

#### Scenario: No attempts recorded yet today

- **GIVEN** the player has no real synced attempts recorded yet today
- **WHEN** Today loads
- **THEN** Today shows an explicit empty state for the Today's Attempts section, not a blank or hidden section
