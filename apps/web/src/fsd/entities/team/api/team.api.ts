import { apiClient, unwrap } from "@/shared/api"

import { withKnownIssues } from "../model/team-modes"
import type { Team, TeamFields, TeamList } from "../model/types"

const withKnownTeamIssues = (list: TeamList): TeamList => ({
  ...list,
  teams: list.teams.map(withKnownIssues),
})

/** The caller's teams in their saved order, each with the rules it breaks. */
export function listTeams(signal?: AbortSignal): Promise<TeamList> {
  return unwrap(apiClient().GET("/api/v1/teams", { signal })).then(
    withKnownTeamIssues
  )
}

/** Creates a team at the end of the order. 400 `teamRulesBroken` (codes under `rules`),
 *  `teamNameTaken` or `teamLimitReached`. */
export function createTeam(fields: TeamFields): Promise<Team> {
  return unwrap(apiClient().POST("/api/v1/teams", { body: fields })).then(
    withKnownIssues
  )
}

/** Replaces a team's fields. 400 as create; 409 `teamRevisionStale` with the team as it stands. */
export function updateTeam(
  teamId: string,
  fields: TeamFields,
  revision: number
): Promise<Team> {
  return unwrap(
    apiClient().PUT("/api/v1/teams/{teamId}", {
      params: { path: { teamId } },
      body: { ...fields, revision },
    })
  ).then(withKnownIssues)
}

/** Deletes a team; the remaining teams close the gap. */
export async function deleteTeam(teamId: string): Promise<void> {
  await unwrap(
    apiClient().DELETE("/api/v1/teams/{teamId}", {
      params: { path: { teamId } },
    })
  )
}

/** Saves the whole order. 409 `teamOrderStale` with the current list when `teamIds` is not
 *  exactly the profile's teams. */
export function reorderTeams(teamIds: readonly string[]): Promise<TeamList> {
  return unwrap(
    apiClient().PUT("/api/v1/teams/order", { body: { teamIds: [...teamIds] } })
  ).then(withKnownTeamIssues)
}
