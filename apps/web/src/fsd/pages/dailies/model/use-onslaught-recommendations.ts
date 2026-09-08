import { useCallback, useMemo, useState } from "react"
import { useQueries, useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  progressionRarity,
  type Alliance,
  type UnitId,
} from "@workspace/game-domain"
import {
  getAscensionCostsMap,
  getCharactersMap,
  getMowsMap,
} from "@workspace/game-catalog/queries"
import {
  getPlayerCharacters,
  getPlayerMows,
} from "@workspace/player-data/queries"

import { goalQueries } from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import { characterDamageTypes } from "@/shared/lib"

import {
  buildOnslaughtRecommendations,
  collectContributions,
  mapRosterCharacter,
} from "./onslaught-recommendations"
import type {
  OnslaughtAscensionGoalContribution,
  OnslaughtRecommendations,
  OnslaughtRecommendationsViewModel,
} from "./onslaught-recommendations.types"
import {
  recommendOnslaughtShardRecipient,
  type OnslaughtShardRecipientResult,
} from "./onslaught-shard-recipient"
import {
  isSalvageTrack,
  SALVAGE_TRACKS,
  type SalvageRosterCatalog,
  type SalvageTrack,
} from "./salvage-recommendations.types"
import {
  usePersistedMode,
  usePersistedPreferences,
  usePersistedTeamSize,
  usePersistedTrack,
} from "./team-recommendation-prefs"
import { MIN_TEAM_SIZE, TEAM_SIZES } from "./team-recommendations.types"
import type { TeamPreferences } from "./team-recommendations.types"

const ONSLAUGHT_TRACK_STORAGE_KEY = "tp.dailies.onslaught.track"
const ONSLAUGHT_MODE_STORAGE_KEY = "tp.dailies.onslaught.mode"
const ONSLAUGHT_TEAM_SIZE_STORAGE_KEY = "tp.dailies.onslaught.teamSize"
const ONSLAUGHT_PREFERENCES_STORAGE_KEY = "tp.dailies.onslaught.preferences"

const DEFAULT_TRACK: SalvageTrack = SALVAGE_TRACKS[0]

// Stable empty references so the memos below do not re-run on every render while the roster key is
// still settling.
const EMPTY_LOCK_IDS: UnitId[] = []
const EMPTY_PREFERENCES: TeamPreferences = {}
const NONE_RECIPIENT: OnslaughtShardRecipientResult = { status: "none" }

/**
 * The selected Onslaught alliance track, persisted per browser under its own key so it is
 * independent of the Salvage Run and Arena pages.
 */
export function usePersistedOnslaughtTrack(): [
  SalvageTrack,
  (track: SalvageTrack) => void,
] {
  return usePersistedTrack(
    ONSLAUGHT_TRACK_STORAGE_KEY,
    isSalvageTrack,
    DEFAULT_TRACK
  )
}

// `useLiveQuery` turns a rejected querier into a permanent `undefined`, indistinguishable from
// "still loading" — a sentinel makes a Dexie failure a real, retryable error instead (same shape as
// `use-shop-recommendations`'s `safeLiveRead`).
const LIVE_QUERY_ERROR = Symbol("live-query-error")

async function safeLiveRead<T>(
  read: () => Promise<T>
): Promise<T | typeof LIVE_QUERY_ERROR> {
  try {
    return await read()
  } catch {
    return LIVE_QUERY_ERROR
  }
}

/**
 * Gathers everything the Onslaught page needs: the Salvage Run data set (roster, character catalog,
 * goals, project goals) plus the player's Machines of War, the MoW catalog, the ascension-cost
 * ladder, and the full `GoalDetail` for every active Ascension goal (so its `acquisitionSources`
 * and target rarity are known). It then builds the track-restricted team recommendations — with the
 * Onslaught-farming Ascension goals as the highest-priority pool — and, separately, the post-battle
 * shard recipient (characters **and** Machines of War). Returns a view-model union: `loading`,
 * `error` (retryable), `insufficient-track` (fewer than three owned characters of the track — the
 * shard recipient is still carried), or `ready`.
 */
export function useOnslaughtRecommendations(
  selectedProjectId: string | undefined
): OnslaughtRecommendationsViewModel {
  const isAuthenticated = useIsAuthenticated()
  const [track, setTrack] = usePersistedOnslaughtTrack()
  const [mode, setMode] = usePersistedMode(ONSLAUGHT_MODE_STORAGE_KEY)
  const [teamSize, setTeamSize] = usePersistedTeamSize(
    ONSLAUGHT_TEAM_SIZE_STORAGE_KEY
  )
  const [preferences, setPreferences] = usePersistedPreferences(
    ONSLAUGHT_PREFERENCES_STORAGE_KEY
  )
  const [randomSeed, setRandomSeed] = useState(0)
  const [retryNonce, setRetryNonce] = useState(0)
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

  const ascensionGoalIds = useMemo(
    () =>
      (goalsQuery.data?.goals ?? [])
        .filter((goal) => goal.goalType === "Ascension")
        .map((goal) => goal.goalId),
    [goalsQuery.data]
  )
  const ascensionDetailQueries = useQueries({
    queries: ascensionGoalIds.map((goalId) => goalQueries.detail(goalId)),
  })
  const ascensionDetailsPending = ascensionDetailQueries.some(
    (query) => query.isPending
  )
  const ascensionDetailsFailed = ascensionDetailQueries.some(
    (query) => query.isError
  )
  // A fresh array every render — memo it on a content key so the recommendations downstream do not
  // rebuild on unrelated renders (mirrors `use-shop-recommendations`'s `detailKey`).
  const ascensionDetailKey = ascensionDetailQueries
    .map((query) =>
      query.data ? `${query.data.goalId}:${query.data.updatedAt}` : ""
    )
    .join("|")
  const ascensionDetails = useMemo(
    () =>
      ascensionDetailQueries.flatMap((query) =>
        query.data ? [query.data] : []
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ascensionDetailKey]
  )

  const rosterRaw = useLiveQuery(
    () => safeLiveRead(async () => (await getPlayerCharacters()) ?? []),
    [retryNonce]
  )
  const mowsRaw = useLiveQuery(
    () => safeLiveRead(async () => (await getPlayerMows()) ?? []),
    [retryNonce]
  )
  const catalogRaw = useLiveQuery(
    () => safeLiveRead(() => getCharactersMap()),
    [retryNonce]
  )
  const mowCatalogRaw = useLiveQuery(
    () => safeLiveRead(() => getMowsMap()),
    [retryNonce]
  )
  const ascensionCostsRaw = useLiveQuery(
    () => safeLiveRead(() => getAscensionCostsMap()),
    [retryNonce]
  )

  const rosterFailed = rosterRaw === LIVE_QUERY_ERROR
  const mowsFailed = mowsRaw === LIVE_QUERY_ERROR
  const catalogFailed = catalogRaw === LIVE_QUERY_ERROR
  const mowCatalogFailed = mowCatalogRaw === LIVE_QUERY_ERROR
  const ascensionCostsFailed = ascensionCostsRaw === LIVE_QUERY_ERROR
  const roster = rosterFailed ? undefined : rosterRaw
  const mows = mowsFailed ? undefined : mowsRaw
  const catalog = catalogFailed ? undefined : catalogRaw
  const mowCatalog = mowCatalogFailed ? undefined : mowCatalogRaw
  const ascensionCosts = ascensionCostsFailed ? undefined : ascensionCostsRaw

  // The owned characters of the selected track's alliance, plus the catalog map (traits / damage
  // types / alliance) and the trait / damage-type unions the preference controls offer — computed
  // over the track roster only, so a control never offers a value the track cannot field.
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

  const playerCharacterById = useMemo(
    () => new Map((roster ?? []).map((record) => [record.unitId, record])),
    [roster]
  )
  const playerMowById = useMemo(
    () => new Map((mows ?? []).map((record) => [record.unitId, record])),
    [mows]
  )
  const selectedProjectGoalPriority = useMemo(
    () =>
      new Map(
        (projectGoalsQuery.data?.goals ?? []).map((entry) => [
          entry.goal.goalId,
          entry.priority,
        ])
      ),
    [projectGoalsQuery.data]
  )
  const overallGoalOrder = useMemo(
    () => (goalsQuery.data?.goals ?? []).map((goal) => goal.goalId),
    [goalsQuery.data]
  )

  const shardRecipient = useMemo<OnslaughtShardRecipientResult>(() => {
    if (!catalog || !mowCatalog || !ascensionCosts) return NONE_RECIPIENT
    return recommendOnslaughtShardRecipient({
      track,
      ascensionGoals: ascensionDetails,
      charactersById: catalog,
      mowsById: mowCatalog,
      playerCharacterById,
      playerMowById,
      ascensionCostsById: ascensionCosts,
      selectedProjectId,
      selectedProjectGoalPriority,
      overallGoalOrder,
    })
  }, [
    track,
    ascensionDetails,
    catalog,
    mowCatalog,
    ascensionCosts,
    playerCharacterById,
    playerMowById,
    selectedProjectId,
    selectedProjectGoalPriority,
    overallGoalOrder,
  ])

  // The Onslaught-farming Ascension-goal characters feeding the Plan Team's leading pool — the
  // Character subset of the shard recipient's already-filtered candidates (track alliance, Onslaught
  // source, outstanding shards). MoW candidates stay out of the team.
  const onslaughtAscensionGoals = useMemo<
    OnslaughtAscensionGoalContribution[]
  >(() => {
    if (shardRecipient.status !== "ready") return []
    return [shardRecipient.recipient, ...shardRecipient.alternates]
      .filter((candidate) => candidate.unitKind === "character")
      .map((candidate) => ({
        unitId: candidate.unitId as UnitId,
        goalId: candidate.goalId,
        ...(candidate.projectId ? { projectId: candidate.projectId } : {}),
      }))
  }, [shardRecipient])

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

  const recommendations = useMemo<OnslaughtRecommendations | null>(() => {
    if (trackRoster.length < MIN_TEAM_SIZE) return null
    return buildOnslaughtRecommendations({
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
      onslaughtAscensionGoals,
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
    onslaughtAscensionGoals,
    lockedRandomUnitIds,
    randomSeed,
    preferences,
    rosterCatalog,
  ])

  const availableSizes = useMemo(
    () => TEAM_SIZES.filter((size) => size <= trackRoster.length),
    [trackRoster]
  )

  const retry = () => {
    void goalsQuery.refetch()
    void projectGoalsQuery.refetch()
    for (const query of ascensionDetailQueries) void query.refetch()
    setRetryNonce((nonce) => nonce + 1)
  }

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
    ascensionDetailsFailed ||
    rosterFailed ||
    mowsFailed ||
    catalogFailed ||
    mowCatalogFailed ||
    ascensionCostsFailed
  ) {
    return { status: "error", retry }
  }

  if (
    goalsQuery.isPending ||
    waitingForProjectGoals ||
    ascensionDetailsPending ||
    !roster ||
    !mows ||
    !catalog ||
    !mowCatalog ||
    !ascensionCosts
  ) {
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
      shardRecipient,
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
    shardRecipient,
  }
}
