import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import {
  createTeam,
  deleteTeam,
  reorderTeams,
  updateTeam,
} from "../api/team.api"
import { teamQueries } from "../api/team.queries"
import { staleTeam, staleTeamOrder } from "./team-errors"
import type { Team, TeamFields, TeamList } from "./types"

/** The caller's teams; `enabled` false (a guest) never requests them. */
export function useTeams(enabled = true) {
  return useQuery({ ...teamQueries.list(), enabled })
}

const listKey = () => teamQueries.list().queryKey

/** Refetches the list in the background: a save resolves as soon as the API answers it. */
function refresh(client: QueryClient) {
  void client.invalidateQueries({ queryKey: listKey() })
}

function setTeam(client: QueryClient, team: Team) {
  client.setQueryData<TeamList>(listKey(), (list) =>
    list
      ? {
          teams: list.teams.some((entry) => entry.id === team.id)
            ? list.teams.map((entry) => (entry.id === team.id ? team : entry))
            : [...list.teams, team],
        }
      : list
  )
}

/** The list in `teamIds` order, renumbered; teams missing from `teamIds` keep their place after. */
export function applyTeamOrder(
  list: TeamList,
  teamIds: readonly string[]
): TeamList {
  const byId = new Map(list.teams.map((team) => [team.id, team]))
  const ordered = teamIds.flatMap((id) => {
    const team = byId.get(id)
    return team ? [team] : []
  })
  const rest = list.teams.filter((team) => !teamIds.includes(team.id))
  return {
    teams: [...ordered, ...rest].map((team, index) => ({
      ...team,
      position: index + 1,
    })),
  }
}

/** Creates a team; the list shows it as soon as the API answers. */
export function useCreateTeam() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (fields: TeamFields) => createTeam(fields),
    onSuccess: (team) => setTeam(client, team),
    onSettled: () => refresh(client),
  })
}

/** Saves a team's fields over the revision it was read at. A stale save puts the team as it
 *  stands into the list, so the editor can reload it. */
export function useUpdateTeam() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      teamId,
      fields,
      revision,
    }: {
      teamId: string
      fields: TeamFields
      revision: number
    }) => updateTeam(teamId, fields, revision),
    onSuccess: (team) => setTeam(client, team),
    onError: (error) => {
      const current = staleTeam(error)
      if (current) setTeam(client, current)
    },
    onSettled: () => refresh(client),
  })
}

/** Deletes a team and refreshes the list. */
export function useDeleteTeam() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (teamId: string) => deleteTeam(teamId),
    onSuccess: (_data, teamId) =>
      client.setQueryData<TeamList>(listKey(), (list) =>
        list
          ? applyTeamOrder(
              { teams: list.teams.filter((team) => team.id !== teamId) },
              []
            )
          : list
      ),
    onSettled: () => refresh(client),
  })
}

/**
 * Saves a new order of every team (design D5). The move shows at once; a failed save puts the
 * previous order back, and a stale one (another device changed the teams) adopts the list the API
 * answered with.
 */
export function useReorderTeams() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (teamIds: readonly string[]) => reorderTeams(teamIds),
    onMutate: async (teamIds) => {
      await client.cancelQueries({ queryKey: listKey() })
      const previous = client.getQueryData<TeamList>(listKey())
      if (previous) {
        client.setQueryData(listKey(), applyTeamOrder(previous, teamIds))
      }
      return { previous }
    },
    onSuccess: (list) => client.setQueryData(listKey(), list),
    onError: (error, _teamIds, context) => {
      const current = staleTeamOrder(error)
      if (current) {
        client.setQueryData(listKey(), current)
      } else if (context?.previous) {
        client.setQueryData(listKey(), context.previous)
      }
    },
    onSettled: () => refresh(client),
  })
}
