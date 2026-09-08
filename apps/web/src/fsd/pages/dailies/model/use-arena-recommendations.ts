import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { getPlayerCharacters } from "@workspace/player-data/queries"

import { goalQueries } from "@/entities/goal"
import { projectQueries, useProjects } from "@/entities/project"

import {
  buildArenaRecommendations,
  collectContributions,
  mapRosterCharacter,
} from "./arena-recommendations"
import {
  ARENA_MIN_TEAM_SIZE,
  type ArenaMode,
  type ArenaRecommendations,
  type ArenaRecommendationsViewModel,
} from "./arena-recommendations.types"

const ARENA_MODE_STORAGE_KEY = "tp.dailies.arena.mode"

function readStoredMode(): ArenaMode {
  try {
    const raw = window.localStorage.getItem(ARENA_MODE_STORAGE_KEY)
    return raw === "power" || raw === "xp" ? raw : "xp"
  } catch {
    return "xp"
  }
}

/**
 * The XP/Power mode toggle, persisted per browser so it survives navigation away from the Arena
 * page and a full reload. Both `localStorage` ends are guarded — a private window or a browser that
 * blocks site data degrades to an in-memory default of `"xp"`.
 */
export function usePersistedArenaMode(): [
  ArenaMode,
  (mode: ArenaMode) => void,
] {
  const [mode, setModeState] = useState<ArenaMode>(readStoredMode)
  const setMode = useCallback((next: ArenaMode) => {
    setModeState(next)
    try {
      window.localStorage.setItem(ARENA_MODE_STORAGE_KEY, next)
    } catch {
      // Best-effort — the in-memory value still updates.
    }
  }, [])
  return [mode, setMode]
}

// `useLiveQuery` turns a rejected querier into a permanent `undefined`, indistinguishable from
// "still loading" — mirror `use-shop-recommendations`'s sentinel so a Dexie failure surfaces as a
// real, retryable error rather than an endless spinner.
const LIVE_QUERY_ERROR = Symbol("live-query-error")

async function safeReadRoster() {
  try {
    return (await getPlayerCharacters()) ?? []
  } catch {
    return LIVE_QUERY_ERROR
  }
}

/**
 * Gathers the roster, goals, and active project the Arena recommendation engine needs, then returns
 * a view-model union for the page: `loading`, `error` (retryable), `no-characters` (fewer than
 * three owned), or `ready` with the recommendations and the mode/regenerate controls.
 */
export function useArenaRecommendations(): ArenaRecommendationsViewModel {
  const isAuthenticated = useIsAuthenticated()
  const [mode, setMode] = usePersistedArenaMode()
  const [randomSeed, setRandomSeed] = useState(0)
  const [retryNonce, setRetryNonce] = useState(0)

  const {
    activeProjectId,
    fetchState: projectsFetchState,
    loading: projectsLoading,
    retry: retryProjects,
  } = useProjects()

  const goalsQuery = useQuery({
    ...goalQueries.list(false),
    enabled: isAuthenticated,
  })
  const projectGoalsQuery = useQuery({
    ...projectQueries.goals(activeProjectId ?? "none"),
    enabled: Boolean(isAuthenticated && activeProjectId),
  })

  const rosterRaw = useLiveQuery(() => safeReadRoster(), [retryNonce])
  const rosterFailed = rosterRaw === LIVE_QUERY_ERROR
  const roster = rosterFailed ? undefined : rosterRaw

  const recommendations = useMemo<ArenaRecommendations | null>(() => {
    if (!roster || roster.length < ARENA_MIN_TEAM_SIZE) return null
    return buildArenaRecommendations({
      mode,
      roster: roster.map(mapRosterCharacter),
      hasActiveProject: Boolean(activeProjectId),
      activeProjectContributions: activeProjectId
        ? collectContributions(
            (projectGoalsQuery.data?.goals ?? []).map((entry) => entry.goal),
            activeProjectId
          )
        : [],
      activeGoalContributions: collectContributions(
        goalsQuery.data?.goals ?? []
      ),
      randomSeed,
    })
  }, [
    roster,
    mode,
    activeProjectId,
    projectGoalsQuery.data,
    goalsQuery.data,
    randomSeed,
  ])

  const retry = useCallback(() => {
    retryProjects()
    void goalsQuery.refetch()
    void projectGoalsQuery.refetch()
    setRetryNonce((nonce) => nonce + 1)
  }, [goalsQuery, projectGoalsQuery, retryProjects])

  const regenerate = useCallback(() => setRandomSeed((seed) => seed + 1), [])

  const waitingForProjectGoals =
    Boolean(activeProjectId) && projectGoalsQuery.isPending
  const projectGoalsErrored =
    Boolean(activeProjectId) && projectGoalsQuery.isError

  if (
    projectsFetchState.status === "error" ||
    goalsQuery.isError ||
    projectGoalsErrored ||
    rosterFailed
  ) {
    return { status: "error", retry }
  }

  if (
    projectsLoading ||
    goalsQuery.isPending ||
    waitingForProjectGoals ||
    !roster
  ) {
    return { status: "loading" }
  }

  if (roster.length < ARENA_MIN_TEAM_SIZE) {
    return { status: "no-characters" }
  }

  if (!recommendations) {
    return { status: "loading" }
  }

  return { status: "ready", mode, setMode, regenerate, recommendations }
}
