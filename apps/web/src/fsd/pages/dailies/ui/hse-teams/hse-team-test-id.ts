import type { HseTeam, HseTeamMode } from "@/features/team-recommendations"

/** The test id of one event team: `hse-team-arena`, `hse-team-onslaught-imperial`, and
 * `hse-team-arena-matching` for the team matching the enemy rule. */
export function hseTeamTestId(mode: HseTeamMode, team: HseTeam): string {
  return `hse-team-${mode}${team.alliance ? `-${team.alliance}` : ""}${team.criteria ? "-matching" : ""}`.toLowerCase()
}
