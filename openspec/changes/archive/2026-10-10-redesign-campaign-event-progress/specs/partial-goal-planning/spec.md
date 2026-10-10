## MODIFIED Requirements

### Requirement: Every estimate surface uses one campaign node-eligibility rule

Goals, Insights, per-project estimates, Today, and Raids Plan SHALL choose farm nodes from the same eligible set. A standing-campaign node SHALL be eligible only when the player's synced campaign progress has reached it. An event-campaign node SHALL be eligible only when its campaign is the currently active campaign event and the player's effective event progress has reached it. Effective event progress is the player's saved manual override when one is set, else the synced event progress, else no progress (see "Only the active campaign event is farmable" in `daily-raids-today`). A material with no eligible node and no supported alternate source SHALL be reported as an unavailable requirement on every surface, with the same blocker reason and no finite completion date.

Assumption: the active campaign event comes from the player's live progress; when it is unknown, no event node is eligible.

Assumption: while the saved overrides are still loading or have failed to load, Goals, Insights and per-project estimates MAY use synced event progress alone. Today and Raids Plan compute no schedule in that state; they wait, or show their error state. So no two surfaces present different computed schedules from different progress.

#### Scenario: A material that drops only at an inactive event node is blocked everywhere

- **GIVEN** a needed material drops only at nodes of an event campaign that is not the currently active event
- **WHEN** Goals, Insights, Today, and Raids Plan estimate the goal
- **THEN** all four report that material as unavailable with the same reason, and none gives the goal a finite completion date

#### Scenario: The active event's reached node stays eligible

- **GIVEN** a needed material drops at a node of the currently active event that the player has reached
- **WHEN** any surface estimates the goal
- **THEN** that node is eligible and priced on every surface

#### Scenario: A manual event override is honoured on every surface

- **GIVEN** a needed material drops only at node 12 of the currently active event's Extremis track
- **AND** there is no synced progress for that track, but the player's saved override sets its completed battle count to 11
- **WHEN** Goals, Insights, Today, and Raids Plan estimate the goal
- **THEN** that node is eligible and priced on every surface, and none of them reports the material as unavailable
