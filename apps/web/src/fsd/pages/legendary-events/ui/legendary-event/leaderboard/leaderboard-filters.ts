import type { LeaderboardControlsState } from "../legendary-event-page.view-model"

/**
 * The leaderboard filters that are on: "Only unlocked" (while the roster is known), "Only in my
 * teams" (while the plan is available) and each picked objective. Deduct scored points and Goals
 * Preview change what a row shows, not which rows are listed, so they are not counted.
 */
export function leaderboardActiveFilterCount(
  state: Pick<
    LeaderboardControlsState,
    "onlyUnlocked" | "onlyInTeams" | "teamUnitIds" | "selectedObjectives"
  >,
  rosterAvailable: boolean
): number {
  return (
    state.selectedObjectives.size +
    (rosterAvailable && state.onlyUnlocked ? 1 : 0) +
    (state.teamUnitIds !== undefined && state.onlyInTeams ? 1 : 0)
  )
}

/** Turns every counted filter off ("Clear filters" in the panel and in the empty list). */
export function clearLeaderboardFilters(
  state: Pick<
    LeaderboardControlsState,
    | "onOnlyUnlockedChange"
    | "onOnlyInTeamsChange"
    | "onSelectedObjectivesChange"
  >
): void {
  state.onOnlyUnlockedChange(false)
  state.onOnlyInTeamsChange(false)
  state.onSelectedObjectivesChange(new Set())
}
