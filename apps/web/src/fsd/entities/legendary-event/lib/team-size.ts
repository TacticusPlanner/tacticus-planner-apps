import type { LegendaryEventTeam } from "../model/plan.types"

/** A Legendary Event team needs at least three characters in the game; the reserve does not
 *  count. */
export const MIN_TEAM_MEMBERS = 3

/**
 * Whether the team has enough non-reserve members to be played (spec: a stored team below three
 * characters is incomplete). An incomplete team stays listed so it can be fixed or deleted, but
 * every calculation ignores it.
 */
export function isCompleteTeam(
  team: Pick<LegendaryEventTeam, "memberUnitIds">
): boolean {
  return team.memberUnitIds.length >= MIN_TEAM_MEMBERS
}
