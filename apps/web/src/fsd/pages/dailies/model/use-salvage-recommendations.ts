import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  progressionRarity,
  type Alliance,
  type UnitId,
} from "@workspace/game-domain"
import { getCharactersMap } from "@workspace/game-catalog/queries"
import { getPlayerCharacters } from "@workspace/player-data/queries"

import { goalQueries } from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import { characterDamageTypes } from "@/shared/lib"

import {
  buildSalvageRecommendations,
  collectContributions,
  mapRosterCharacter,
} from "./salvage-recommendations"
import {
  isSalvageTrack,
  SALVAGE_TRACKS,
  type SalvageRecommendations,
  type SalvageRecommendationsViewModel,
  type SalvageRosterCatalog,
  type SalvageTrack,
} from "./salvage-recommendations.types"
import {
  usePersistedMode,
  usePersistedPreferences,
  usePersistedTeamSize,
} from "./team-recommendation-prefs"
import { MIN_TEAM_SIZE, TEAM_SIZES } from "./team-recommendations.types"
import type { TeamPreferences } from "./team-recommendations.types"

const SALVAGE_TRACK_STORAGE_KEY = "tp.dailies.salvage.track"
const SALVAGE_MODE_STORAGE_KEY = "tp.dailies.salvage.mode"
const SALVAGE_TEAM_SIZE_STORAGE_KEY = "tp.dailies.salvage.teamSize"
const SALVAGE_PREFERENCES_STORAGE_KEY = "tp.dailies.salvage.preferences"

const DEFAULT_TRACK: SalvageTrack = SALVAGE_TRACKS[0]

// Stable empty references so the recommendations memo does not re-run on every render while the
// roster key is still settling.
const EMPTY_LOCK_IDS: UnitId[] = []
const EMPTY_PREFERENCES: TeamPreferences = {}

function readStoredTrack(): SalvageTrack {
  try {
    const raw = window.localStorage.getItem(SALVAGE_TRACK_STORAGE_KEY)
    return isSalvageTrack(raw) ? raw : DEFAULT_TRACK
  } catch {
    return DEFAULT_TRACK
  }
}

/**
 * The selected Salvage Run alliance track, persisted per browser so it survives navigation away
 * from the page and a full reload. Guarded the same way as the mode toggle — a private window
 * degrades to the Imperial default.
 */
export function usePersistedSalvageTrack(): [
  SalvageTrack,
  (track: SalvageTrack) => void,
] {
  const [track, setTrackState] = useState<SalvageTrack>(readStoredTrack)
  const setTrack = useCallback((next: SalvageTrack) => {
    setTrackState(next)
    try {
      window.localStorage.setItem(SALVAGE_TRACK_STORAGE_KEY, next)
    } catch {
      // Best-effort — the in-memory value still updates.
    }
  }, [])
  return [track, setTrack]
}

// `useLiveQuery` turns a rejected querier into a permanent `undefined`, indistinguishable from
// "still loading" — a sentinel makes a Dexie failure a real, retryable error instead.
const LIVE_QUERY_ERROR = Symbol("live-query-error")

async function safeReadRoster() {
  try {
    return (await getPlayerCharacters()) ?? []
  } catch {
    return LIVE_QUERY_ERROR
  }
}

async function safeReadCatalog() {
  try {
    return await getCharactersMap()
  } catch {
    return LIVE_QUERY_ERROR
  }
}

/**
 * Gathers the roster, goals, and character catalog the Salvage Run engine needs, narrows the
 * roster to the selected alliance track, and returns a view-model union for the page: `loading`,
 * `error` (retryable), `insufficient-track` (the track owns fewer than three characters), or
 * `ready` with the recommendations and the track / mode / size / preference / regenerate / lock
 * controls. The selected project is passed in by the page from the shared Dailies layout context.
 */
export function useSalvageRecommendations(
  selectedProjectId: string | undefined
): SalvageRecommendationsViewModel {
  const isAuthenticated = useIsAuthenticated()
  const [track, setTrack] = usePersistedSalvageTrack()
  const [mode, setMode] = usePersistedMode(SALVAGE_MODE_STORAGE_KEY)
  const [teamSize, setTeamSize] = usePersistedTeamSize(
    SALVAGE_TEAM_SIZE_STORAGE_KEY
  )
  const [preferences, setPreferences] = usePersistedPreferences(
    SALVAGE_PREFERENCES_STORAGE_KEY
  )
  const [randomSeed, setRandomSeed] = useState(0)
  const [retryNonce, setRetryNonce] = useState(0)
  // Random-Team locks, pinned to a snapshot of the track's owned-character id set. Session-only.
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

  const catalogRaw = useLiveQuery(() => safeReadCatalog(), [retryNonce])
  const catalogFailed = catalogRaw === LIVE_QUERY_ERROR
  const catalog = catalogFailed ? undefined : catalogRaw

  // The owned characters of the selected track's alliance, plus the catalog map (traits / damage
  // types / alliance) and the trait / damage-type unions the preference controls offer — all
  // computed over the track roster only, so a control never offers a value the track cannot field.
  const { trackRoster, rosterCatalog, availableTraits, availableDamageTypes } =
    useMemo(() => {
      const map: Map<
        UnitId,
        {
          traits: readonly string[]
          damageTypes: readonly string[]
          alliance: Alliance
        }
      > = new Map()
      const traits = new Set<string>()
      const damageTypes = new Set<string>()
      const inTrack: NonNullable<typeof roster> = []
      if (roster && catalog) {
        for (const character of roster) {
          const view = catalog.get(character.unitId)
          if (!view) continue
          const characterTraits = view.traits ?? []
          const characterDamage = characterDamageTypes(view)
          map.set(character.unitId as UnitId, {
            traits: characterTraits,
            damageTypes: characterDamage,
            alliance: view.alliance,
          })
          if (view.alliance !== track) continue
          inTrack.push(character)
          for (const trait of characterTraits) traits.add(trait)
          for (const damage of characterDamage) damageTypes.add(damage)
        }
      }
      return {
        trackRoster: inTrack,
        rosterCatalog: map as SalvageRosterCatalog,
        availableTraits: [...traits].sort(),
        availableDamageTypes: [...damageTypes].sort(),
      }
    }, [roster, catalog, track])

  // When the set of owned track-character ids changes (roster edit or track switch), drop the
  // locks — reconciled during render rather than in an effect.
  const rosterKey = `${track}:${trackRoster
    .map((character) => character.unitId)
    .slice()
    .sort()
    .join(",")}`
  if (roster && catalog && locks.rosterKey !== rosterKey) {
    setLocks({ rosterKey, ids: [] })
  }
  const lockedRandomUnitIds =
    locks.rosterKey === rosterKey ? locks.ids : EMPTY_LOCK_IDS

  const recommendations = useMemo<SalvageRecommendations | null>(() => {
    if (trackRoster.length < MIN_TEAM_SIZE) return null
    return buildSalvageRecommendations({
      mode,
      track,
      roster: trackRoster.map(mapRosterCharacter),
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
      preferences,
      rosterCatalog,
    })
  }, [
    trackRoster,
    mode,
    track,
    teamSize,
    selectedProjectId,
    projectGoalsQuery.data,
    goalsQuery.data,
    lockedRandomUnitIds,
    randomSeed,
    preferences,
    rosterCatalog,
  ])

  const availableSizes = useMemo(
    () => TEAM_SIZES.filter((size) => size <= trackRoster.length),
    [trackRoster]
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

  if (
    goalsQuery.isError ||
    projectGoalsErrored ||
    rosterFailed ||
    catalogFailed
  ) {
    return { status: "error", retry }
  }

  if (goalsQuery.isPending || waitingForProjectGoals || !roster || !catalog) {
    return { status: "loading" }
  }

  if (trackRoster.length < MIN_TEAM_SIZE) {
    return {
      status: "insufficient-track",
      track,
      setTrack,
      ownedCount: trackRoster.length,
      needed: MIN_TEAM_SIZE - trackRoster.length,
      eligible: trackRoster.map((character) => {
        const mapped = mapRosterCharacter(character)
        return {
          unitId: mapped.unitId,
          rank: mapped.rank,
          rarity: progressionRarity(mapped.progression),
        }
      }),
    }
  }

  if (!recommendations) {
    return { status: "loading" }
  }

  return {
    status: "ready",
    track,
    setTrack,
    mode,
    setMode,
    teamSize,
    setTeamSize,
    availableSizes,
    preferences: preferences ?? EMPTY_PREFERENCES,
    setPreferences,
    availableTraits,
    availableDamageTypes,
    toggleRandomLock,
    lockedRandomUnitIds,
    regenerate,
    recommendations,
  }
}
