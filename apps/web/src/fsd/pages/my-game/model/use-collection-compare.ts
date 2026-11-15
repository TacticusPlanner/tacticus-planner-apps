import { useEffect, useMemo } from "react"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  diffRosters,
  type DiffRoster,
  type UnitDiff,
} from "@/entities/roster-snapshot"

import { COMPARE_CURRENT, resolveCompareSources } from "./compare-query"
import { teamUnitIdsOf } from "./compare-view"
import {
  useCompareSources,
  useRosterDiffContext,
  useSourceRoster,
  type CompareSource,
  type CompareSources,
} from "./use-compare-data"
import type { CollectionRosterOverride } from "./use-collection-view"
import type { CompareQueryState } from "./use-compare-query"

export type CollectionCompareState =
  | { mode: "off" }
  | { mode: "guest" }
  | { mode: "loading" }
  | { mode: "error"; retry: () => void }
  /** No source exists yet. */
  | { mode: "empty"; sources: CompareSources }
  | {
      mode: "ready"
      sources: CompareSources
      from: CompareSource
      /** null is the current roster. */
      to: CompareSource | null
      diffs: ReadonlyMap<string, UnitDiff>
      /** The Legendary Event filter's units; null without one. */
      teamUnitIds: ReadonlySet<string> | null
    }

/**
 * Compare mode's data (design D4): the sources, the two rosters the URL names and their diff. The
 * "to" roster, when a snapshot, is handed to the Collection view as `toRoster` so the list shows
 * that state. A guest requests nothing.
 */
export function useCollectionCompare(compare: CompareQueryState): {
  state: CollectionCompareState
  toRoster: CollectionRosterOverride | undefined
} {
  const isAuthenticated = useIsAuthenticated()
  const { query, applyFixes } = compare
  const on = query.compare !== null
  const enabled = isAuthenticated && on
  const sourcesRead = useCompareSources(enabled)
  const sources = sourcesRead.status === "ready" ? sourcesRead.data : undefined

  const resolved = useMemo(
    () =>
      sources
        ? resolveCompareSources(
            query,
            sources.sources,
            sources.plans.map((plan) => plan.eventId)
          )
        : undefined,
    [sources, query]
  )
  const fixesKey =
    resolved && Object.keys(resolved.fixes).length > 0
      ? JSON.stringify(resolved.fixes)
      : ""
  useEffect(() => {
    if (fixesKey) applyFixes(JSON.parse(fixesKey) as Record<string, string>)
  }, [fixesKey, applyFixes])

  const fromRead = useSourceRoster(resolved?.from ?? null, enabled)
  const toRead = useSourceRoster(resolved?.to ?? COMPARE_CURRENT, enabled)
  const contextRead = useRosterDiffContext()

  const fromRoster = fromRead.status === "ready" ? fromRead.data : undefined
  const toRoster = toRead.status === "ready" ? toRead.data : undefined
  const context = contextRead.status === "ready" ? contextRead.data : undefined
  const diffs = useMemo(
    () =>
      fromRoster && toRoster && context
        ? new Map(
            diffRosters(fromRoster, toRoster, context).map((diff) => [
              diff.unitId,
              diff,
            ])
          )
        : undefined,
    [fromRoster, toRoster, context]
  )

  const teamUnitIds = useMemo(() => {
    if (!sources || query.event === null) return null
    const plan = sources.plans.find((entry) => entry.eventId === query.event)
    return teamUnitIdsOf(plan?.teams ?? [], query.lane)
  }, [sources, query.event, query.lane])

  const toOverride = useMemo(
    () =>
      resolved && resolved.to !== COMPARE_CURRENT && toRoster
        ? asCollectionRoster(toRoster)
        : undefined,
    [resolved, toRoster]
  )

  // Not memoized: each part it returns is, so consumers see stable diffs and sources.
  const state = ((): CollectionCompareState => {
    if (!on) return { mode: "off" }
    if (!isAuthenticated) return { mode: "guest" }
    if (sourcesRead.status === "error") {
      return { mode: "error", retry: sourcesRead.retry }
    }
    if (!sources || !resolved) return { mode: "loading" }
    if (resolved.from === null) return { mode: "empty", sources }
    for (const read of [fromRead, toRead, contextRead]) {
      if (read.status === "error") return { mode: "error", retry: read.retry }
    }
    const byId = new Map(sources.sources.map((source) => [source.id, source]))
    const from = byId.get(resolved.from)
    if (!diffs || !from) return { mode: "loading" }
    return {
      mode: "ready",
      sources,
      from,
      to:
        resolved.to === COMPARE_CURRENT
          ? null
          : (byId.get(resolved.to) ?? null),
      diffs,
      teamUnitIds,
    }
  })()

  return { state, toRoster: toOverride }
}

/** A stored roster in the synced roster's shape, for the Collection view. */
function asCollectionRoster(roster: DiffRoster): CollectionRosterOverride {
  return {
    characters: (roster.characters ??
      []) as CollectionRosterOverride["characters"],
    mows: (roster.mows ?? []) as CollectionRosterOverride["mows"],
  }
}
