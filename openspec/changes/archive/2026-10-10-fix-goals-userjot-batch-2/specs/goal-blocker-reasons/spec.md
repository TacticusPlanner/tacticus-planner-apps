## ADDED Requirements

### Requirement: A prerequisite reason names the goal it waits on

A reason caused by an unreached prerequisite goal SHALL name that goal by its unit and goal kind (for example "Waiting on the Bellator Unlock goal to be reached first."). Two different unreached prerequisites SHALL appear as two separate lines. While a prerequisite goal's details are still loading, the reason SHALL fall back to the generic "waiting on a prerequisite goal" sentence.

#### Scenario: Named prerequisite

- **WHEN** a goal depends on an unreached Unlock goal for Bellator
- **THEN** its tooltip reads that it is waiting on the Bellator Unlock goal

#### Scenario: Two prerequisites

- **WHEN** a goal depends on two different unreached goals
- **THEN** its tooltip lists one named line for each

#### Scenario: Prerequisite still loading

- **WHEN** a prerequisite goal's details have not loaded yet
- **THEN** the reason shows the generic prerequisite sentence

### Requirement: The Restricted tooltip explains what Restricted means

The tooltip of the Restricted indicator SHALL start with a one-line explanation that the goal can only partly progress until the listed reasons are resolved, followed by those reasons. The Blocked indicator's tooltip SHALL NOT include this explanation.

#### Scenario: Restricted tooltip

- **WHEN** the user hovers or focuses a Restricted indicator
- **THEN** the tooltip starts with the Restricted explanation, followed by the reasons

#### Scenario: Blocked tooltip

- **WHEN** the user hovers or focuses a Blocked indicator
- **THEN** the tooltip lists the reasons without the Restricted explanation
