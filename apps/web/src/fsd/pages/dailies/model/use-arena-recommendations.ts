import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import type { UnitId } from "@workspace/game-domain"
import { getPlayerCharacters } from "@workspace/player-data/queries"

import { goalQueries } from "@/entities/goal"
import { projectQueries } from "@/entities/project"

import {
  buildArenaRecommendations,
  collectContributions,
  mapRosterCharacter,
} from "./arena-recommendations"
import {
  ARENA_MIN_TEAM_SIZE,
  ARENA_TEAM_SIZES,
  type ArenaMode,
  type ArenaRecommendations,
  type ArenaRecommendationsViewModel,
} from "./arena-recommendations.types"

const ARENA_MODE_STORAGE_KEY = "tp.dailies.arena.mode"
const ARENA_TEAM_SIZE_STORAGE_KEY = "tp.dailies.arena.teamSize"
const DEFAULT_TEAM_SIZE = ARENA_MIN_TEAM_SIZE
// Stable empty reference so the recommendations memo does not re-run on every render while the
// roster key is still settling.
const EMPTY_LOCK_IDS: UnitId[] = []

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

function readStoredTeamSize(): number {
  try {
    const raw = Number(window.localStorage.getItem(ARENA_TEAM_SIZE_STORAGE_KEY))
    return ARENA_TEAM_SIZES.includes(raw) ? raw : DEFAULT_TEAM_SIZE
  } catch {
    return DEFAULT_TEAM_SIZE
  }
}

/**
 * The page-level Team size (3–5), persisted per browser exactly like the XP/Power mode. A stored
 * value outside the offered set, or a `localStorage` failure, falls back to the three-character
 * default.
 */
export function usePersistedTeamSize(): [number, (size: number) => void] {
  const [teamSize, setTeamSizeState] = useState<number>(readStoredTeamSize)
  const setTeamSize = useCallback((next: number) => {
    setTeamSizeState(next)
    try {
      window.localStorage.setItem(ARENA_TEAM_SIZE_STORAGE_KEY, String(next))
    } catch {
      // Best-effort — the in-memory value still updates.
    }
  }, [])
  return [teamSize, setTeamSize]
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
 * Gathers the roster and goals the Arena recommendation engine needs for the given selected
 * project, then returns a view-model union for the page: `loading`, `error` (retryable),
 * `no-characters` (fewer than three owned), or `ready` with the recommendations and the
 * mode / team-size / regenerate / lock controls. The selected project is passed in by the page
 * from the shared Dailies layout context, so this hook stays free of router coupling.
 */
export function useArenaRecommendations(
  selectedProjectId: string | undefined
): ArenaRecommendationsViewModel {
  const isAuthenticated = useIsAuthenticated()
  const [mode, setMode] = usePersistedArenaMode()
  const [teamSize, setTeamSize] = usePersistedTeamSize()
  const [randomSeed, setRandomSeed] = useState(0)
  const [retryNonce, setRetryNonce] = useState(0)
  // Random-Team locks, pinned to a snapshot of the owned-character id set. Session-only.
  const [locks, setLocks] = useState<{ rosterKey: string; ids: UnitId[] }>({
    rosterKey: "",
    ids: [],
  })

  const goalsQuery = useQuery({
    ...goalQueries.list(false),
    enabled: isAuthenticated,
  })
  const projectGoalsQuery = useQuery({
    ...projectQueries.goals(selectedProjectId ?? "none"),
    enabled: Boolean(isAuthenticated && selectedProjectId),
  })

  const rosterRaw = useLiveQuery(() => safeReadRoster(), [retryNonce])
  const rosterFailed = rosterRaw === LIVE_QUERY_ERROR
  const roster = rosterFailed ? undefined : rosterRaw

  // When the set of owned character ids changes, drop the locks — reconciled during render (the
  // documented "adjust state on prop change" pattern) rather than in an effect.
  const rosterKey = roster
    ? roster
        .map((character) => character.unitId)
        .slice()
        .sort()
        .join(",")
    : ""
  if (roster && locks.rosterKey !== rosterKey) {
    setLocks({ rosterKey, ids: [] })
  }
  const lockedRandomUnitIds =
    locks.rosterKey === rosterKey ? locks.ids : EMPTY_LOCK_IDS

  const recommendations = useMemo<ArenaRecommendations | null>(() => {
    if (!roster || roster.length < ARENA_MIN_TEAM_SIZE) return null
    return buildArenaRecommendations({
      mode,
      roster: roster.map(mapRosterCharacter),
      selectedProjectId,
      activeProjectContributions: selectedProjectId
        ? collectContributions(
            (projectGoalsQuery.data?.goals ?? []).map((entry) => entry.goal),
            selectedProjectId
          )
        : [],
      activeGoalContributions: collectContributions(
        goalsQuery.data?.goals ?? []
      ),
      teamSize,
      lockedRandomUnitIds,
      randomSeed,
    })
  }, [
    roster,
    mode,
    teamSize,
    selectedProjectId,
    projectGoalsQuery.data,
    goalsQuery.data,
    lockedRandomUnitIds,
    randomSeed,
  ])

  const availableSizes = useMemo(
    () => ARENA_TEAM_SIZES.filter((size) => size <= (roster?.length ?? 0)),
    [roster]
  )

  const retry = useCallback(() => {
    void goalsQuery.refetch()
    void projectGoalsQuery.refetch()
    setRetryNonce((nonce) => nonce + 1)
  }, [goalsQuery, projectGoalsQuery])

  const regenerate = useCallback(() => setRandomSeed((seed) => seed + 1), [])

  const toggleRandomLock = useCallback(
    (unitId: UnitId) => {
      setLocks((prev) => {
        if (prev.ids.includes(unitId)) {
          return {
            rosterKey: prev.rosterKey,
            ids: prev.ids.filter((id) => id !== unitId),
          }
        }
        if (prev.ids.length >= teamSize) return prev
        return { rosterKey: prev.rosterKey, ids: [...prev.ids, unitId] }
      })
    },
    [teamSize]
  )

  const waitingForProjectGoals =
    Boolean(selectedProjectId) && projectGoalsQuery.isPending
  const projectGoalsErrored =
    Boolean(selectedProjectId) && projectGoalsQuery.isError

  if (goalsQuery.isError || projectGoalsErrored || rosterFailed) {
    return { status: "error", retry }
  }

  if (goalsQuery.isPending || waitingForProjectGoals || !roster) {
    return { status: "loading" }
  }

  if (roster.length < ARENA_MIN_TEAM_SIZE) {
    return { status: "no-characters" }
  }

  if (!recommendations) {
    return { status: "loading" }
  }

  return {
    status: "ready",
    mode,
    setMode,
    teamSize,
    setTeamSize,
    availableSizes,
    toggleRandomLock,
    lockedRandomUnitIds,
    regenerate,
    recommendations,
  }
}
