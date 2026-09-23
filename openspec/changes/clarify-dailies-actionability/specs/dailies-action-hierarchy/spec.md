## Purpose

Makes the next currently usable farming action easy to find on Dailies while keeping explanations of blocked, exhausted, and already-satisfied work accessible.

## ADDED Requirements

### Requirement: Today's actionable raids lead supporting information

When Today has at least one currently usable scheduled node, its farming actions SHALL be presented before account-wide attempt history, exhausted/locked-node explanations, or already-satisfied prerequisite detail. Non-actionable information SHALL remain available but visually secondary. Re-grouping for display SHALL NOT change goal priority, resource ordering, raid counts, or the schedule calculation.

#### Scenario: Actionable and exhausted nodes

- **WHEN** Today has at least one node with usable real attempts and explanatory data about exhausted nodes
- **THEN** the usable scheduled action is discoverable before the exhausted-node explanation, without claiming the exhausted node can still be raided

#### Scenario: No actionable nodes

- **WHEN** Today has no currently usable scheduled node
- **THEN** the page states that condition and keeps relevant explanation or next-step context reachable rather than showing a blank action area

### Requirement: Completion and cap labels have clear meaning

The Dailies presentation SHALL distinguish a node whose real synced attempts are exhausted from a node whose simulated plan merely allocates its full daily cap. A “Max raids” planned-count label SHALL NOT be treated as proof that the player has used every real attempt.

#### Scenario: Planned maximum with real attempts remaining

- **WHEN** a plan allocates a node's full cap but synced attempts remain
- **THEN** the node remains actionable and its label does not state that real attempts are exhausted

### Requirement: Satisfied prerequisite detail does not obscure the active target

When an already-satisfied Unlock prerequisite is shown for a later-stage active Rank goal, the active Rank target and its next farming action SHALL remain prominent. The satisfied Unlock detail SHALL be condensed or collapsible rather than occupying the primary action space.

#### Scenario: Unlocked unit with Rank work

- **WHEN** an already-unlocked unit has an active Rank goal and its satisfied Unlock information is displayed
- **THEN** the Rank target and actionable farming are visible ahead of the satisfied Unlock detail
