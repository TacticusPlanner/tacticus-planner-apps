import type { ResolvedRaidBossEncounterLocation } from "@/entities/raid-boss"

/** The page's URL state (`raid-boss-library`): the path entity, `tab`, `season`, `comp` and the
 *  season-board encounter context `tier`/`set`/`encounter`. Pure helpers over search params. */
export type RaidBossesTab = "details" | "seasons" | "meta"

const CONTEXT_KEYS = ["tier", "set", "encounter"] as const

export function parseRaidBossesTab(raw: string | null): RaidBossesTab {
  return raw === "seasons" || raw === "meta" ? raw : "details"
}

const isRaidBossesTab = (raw: string) =>
  raw === "details" || raw === "seasons" || raw === "meta"

function dropEncounterContext(search: URLSearchParams) {
  for (const key of CONTEXT_KEYS) search.delete(key)
}

/** `season` is omitted for the default (first) season. */
function writeSeason(
  search: URLSearchParams,
  seasonId: string | undefined,
  seasonIds: readonly string[]
) {
  if (!seasonId || seasonId === seasonIds[0]) search.delete("season")
  else search.set("season", seasonId)
}

export interface RaidBossesSearchState {
  catalogReady: boolean
  metaReady: boolean
  /** The path entity id, if any. */
  entityId: string | undefined
  /** Whether `entityId` names a served entity. */
  entityKnown: boolean
  /** The first served boss (or prime), the fallback for an unknown entity. */
  firstEntityId: string | undefined
  /** Whether `tier`/`set`/`encounter` resolve to an exact encounter of the selected entity. */
  hasExactLocation: boolean
  seasonIds: readonly string[]
  /** The resolved season (requested when valid, else the first). */
  selectedSeasonId: string | undefined
  /** The `comp` param when it names a served Comp. */
  compId: string | undefined
}

/**
 * The repaired URL, or `null` when nothing needs repairing (design decision 4). In order: an
 * unknown entity falls back to the first entity when `tab` is set, else to the bare collection;
 * invalid encounter context is dropped as a group; an invalid `tab` becomes `details`; `season`
 * becomes the resolved id, or is dropped when that is the first season and neither an entity nor
 * `tab` is set; an unknown `comp` is dropped once the Meta dataset is known. `pathname` is set
 * only when the entity changes.
 */
export function repairRaidBossesSearch(
  current: URLSearchParams,
  state: RaidBossesSearchState
): { pathname?: string; search: URLSearchParams } | null {
  if (!state.catalogReady) return null
  const next = new URLSearchParams(current)
  let pathname: string | undefined
  let hasEntity = state.entityKnown

  if (state.entityId && !state.entityKnown) {
    dropEncounterContext(next)
    const fallback = next.has("tab") ? state.firstEntityId : undefined
    pathname = fallback
      ? `/library/raid-bosses/${fallback}`
      : "/library/raid-bosses"
    hasEntity = Boolean(fallback)
  } else if (
    state.entityKnown &&
    CONTEXT_KEYS.some((key) => next.has(key)) &&
    !state.hasExactLocation
  ) {
    dropEncounterContext(next)
  }

  const tab = next.get("tab")
  if (tab !== null && !isRaidBossesTab(tab)) next.set("tab", "details")

  const season = next.get("season")
  if (season && season !== state.selectedSeasonId) {
    if (
      state.selectedSeasonId &&
      (hasEntity ||
        next.has("tab") ||
        state.selectedSeasonId !== state.seasonIds[0])
    )
      next.set("season", state.selectedSeasonId)
    else next.delete("season")
  }

  const comp = next.get("comp")
  if (state.metaReady && comp !== null && comp !== state.compId)
    next.delete("comp")

  if (pathname === undefined && next.toString() === current.toString())
    return null
  return { pathname, search: next }
}

/** Applies `updates` (`undefined` deletes) to a copy of `current`. */
export function updateSearch(
  current: URLSearchParams,
  updates: Record<string, string | undefined>
) {
  const next = new URLSearchParams(current)
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) next.delete(key)
    else next.set(key, value)
  }
  return next
}

/** The season reference's search for `seasonId`, without any encounter context. */
export function seasonReferenceSearch(
  current: URLSearchParams,
  seasonId: string | undefined,
  seasonIds: readonly string[]
) {
  const next = new URLSearchParams(current)
  writeSeason(next, seasonId, seasonIds)
  dropEncounterContext(next)
  return next
}

/** A season-board encounter's detail search, carrying its exact context. */
export function encounterSearch(
  current: URLSearchParams,
  located: ResolvedRaidBossEncounterLocation
) {
  return updateSearch(current, {
    season: located.seasonId,
    tier: String(located.tier),
    set: String(located.set),
    encounter: String(located.encounterIndex),
  })
}

/** A directly selected entity's search: no encounter context. */
export function entitySearch(current: URLSearchParams) {
  const next = new URLSearchParams(current)
  dropEncounterContext(next)
  return next
}
