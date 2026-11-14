## Why

Players asked for a filter that lists only the characters used in their Legendary Event teams ("Filter Selected Characters for Legendary Events" on UserJot). V1 had it on the Master Table and on each event's points table, and players used it to see which characters really need upgrading. V2's Master Table already has an "In teams" unit set, but the event page's Eligibility leaderboards (the lane leaderboard and the cross-lane one) only filter by "Only unlocked" and objectives.

No companion API change: the plan's teams are already read on the page.

## What Changes

- The leaderboards' Filters panel gains an **Only in my teams** switch (default off), next to "Only unlocked".
- On a lane leaderboard it keeps the units that lane's teams use, as a member or as the reserve. On the cross-lane leaderboard it keeps the units the teams of the lanes its own lane selector shows use. Incomplete teams (fewer than three members) are left out, as in the Master Table's In teams.
- It counts as an active filter on the Filters button, shares state with the other filters (all lanes and the Overview, reset on leaving the page) and combines with them.
- While the plan is unavailable (signed out, loading, failed) the switch is disabled and filters nothing.
- When it leaves no rows, the body says "Your teams here have no units yet."

## Capabilities

### Modified Capabilities

- `legendary-event-eligibility`: adds the Only in my teams leaderboard filter.

## Impact

- `entities/legendary-event`: `teamUnitIdsByLane` (`lib/lane-teams.ts`), `LeaderboardFilter.teamUnitIds` / `filterLeaderboard` (`lib/unit-potential.ts`).
- `pages/legendary-events/ui/legendary-event`: controls state (`onlyInTeams`, `teamUnitIds`), `leaderboard-controls.tsx`, `leaderboard.view-model.ts` (`shownTeamUnitIds`, `noneInTeams` body), `leaderboard-section.tsx`, `overview/cross-lane-leaderboard.tsx`, `legendary-event-page.tsx`.
- `public/locales/{en,de,es,fr}/legendaryEvents.json`: `leaderboard.onlyInTeams`, `leaderboard.noneInTeams`.
