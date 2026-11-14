## ADDED Requirements

### Requirement: Only in my teams leaderboard filter

The leaderboards' shared filters SHALL include an **Only in my teams** switch (default off) after "Only unlocked". When on, a lane leaderboard SHALL list only the units that lane's teams in the player's plan use, as a member or as the reserve, and the cross-lane leaderboard SHALL list only the units the teams of the lanes its own lane selector shows use. Incomplete teams count. The switch SHALL combine with the other filters, share their state across the three lanes and the cross-lane leaderboard (persisting while on the page, reset on leaving it) and count as one active filter on the **Filters** button. While the plan is unavailable (signed out, loading or failed) the switch SHALL be disabled and filter nothing. When the switch leaves no rows the leaderboard SHALL show "Your teams here have no units yet." instead of the no-unlocked or no-match body.

#### Scenario: Lane leaderboard

- **GIVEN** the Alpha teams use `bloodDante` and `ultraCalgar` (one as the reserve), and a Beta team uses `ultraTigurius`
- **WHEN** the user turns on Only in my teams on the Alpha leaderboard
- **THEN** only Dante and Calgar are listed, whether owned or locked

#### Scenario: Cross-lane leaderboard follows its lane selector

- **GIVEN** only a Beta team uses `bloodDante`
- **WHEN** the user turns on Only in my teams on the cross-lane leaderboard, then unchecks Beta in its lane selector
- **THEN** Dante is the only row and the Filters button reads "Filters (1)", then no row is listed and the body reads "Your teams here have no units yet."

#### Scenario: Plan unavailable

- **WHEN** a signed-out visitor opens the leaderboard's Filters panel
- **THEN** Only in my teams is disabled
