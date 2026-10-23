import type { HseTeam, HseTeamMode } from "@/features/team-recommendations"

/** The test id of one event team: `hse-team-arena`, `hse-team-onslaught-imperial`, ... */
export function hseTeamTestId(mode: HseTeamMode, team: HseTeam): string {
  return `hse-team-${mode}${team.alliance ? `-${team.alliance}` : ""}`.toLowerCase()
}
