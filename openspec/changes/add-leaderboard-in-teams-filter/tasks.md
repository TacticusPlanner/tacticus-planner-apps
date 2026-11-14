## 1. Filter

- [x] 1.1 `teamUnitIdsByLane` (members and reserve per lane, incomplete teams included) with a unit test
- [x] 1.2 `LeaderboardFilter.teamUnitIds` in `filterLeaderboard`; `noneInTeams` empty body
- [x] 1.3 Page state `onlyInTeams` / `teamUnitIds` from the read plan; lane and cross-lane leaderboards pass their shown lanes' units

## 2. Controls and i18n

- [x] 2.1 "Only in my teams" switch in the Filters panel, disabled without a plan, counted on the Filters button
- [x] 2.2 `leaderboard.onlyInTeams`, `leaderboard.noneInTeams` in en, de, es, fr

## 3. Gates

- [x] 3.1 Lane and cross-lane leaderboard tests (filtering, empty body, disabled, lane selector), typecheck, eslint on changed files
