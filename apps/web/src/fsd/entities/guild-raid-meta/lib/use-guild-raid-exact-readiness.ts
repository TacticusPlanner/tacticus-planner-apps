import { useMemo } from "react"

import { combineReadStates } from "@/shared/lib"
import { usePlayerChunk } from "@/shared/local-data"

import {
  buildGuildRaidExactReadinessView,
  buildGuildRaidRosterInvestment,
  type GuildRaidExactReadinessView,
} from "./build-guild-raid-exact-readiness-view"
import type { GuildRaidInvestmentThreshold } from "./resolve-guild-raid-investment-threshold"
import { useGuildRaidMetaCatalog } from "./use-guild-raid-meta-presentation"

export type GuildRaidExactReadinessQuery =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | GuildRaidExactReadinessView

/** Reactive public entity API for Meta lineup readiness against the current player's synced roster.
 * `threshold` is the boss's live investment target (see `resolveGuildRaidLiveInvestmentThreshold`);
 * `null` keeps picks and status but withholds every percentage. */
export function useGuildRaidExactReadiness(
  bossUnitSetId: string,
  threshold: GuildRaidInvestmentThreshold | null
): GuildRaidExactReadinessQuery {
  const catalog = useGuildRaidMetaCatalog()
  const charactersRead = usePlayerChunk("characters")
  const mowsRead = usePlayerChunk("mows")
  const roster = useMemo(
    () => combineReadStates(charactersRead, mowsRead),
    [charactersRead, mowsRead]
  )

  return useMemo((): GuildRaidExactReadinessQuery => {
    // Guarding on the single-literal "ready" case (rather than checking each of the other branch's
    // several status values in turn) is what lets TS narrow `catalog` to the ready shape below.
    if (catalog.status !== "ready") {
      if (catalog.status === "failed") {
        return { status: "failed", retry: catalog.retry }
      }
      return catalog.status === "absent"
        ? { status: "absentMeta" }
        : { status: "loading" }
    }

    if (roster.status === "error") {
      return { status: "failed", retry: roster.retry }
    }
    if (roster.status === "loading") return { status: "loading" }

    // An unsynced chunk reads as null: the lineups are then shown without a roster.
    const [characters, mows] = roster.data

    return buildGuildRaidExactReadinessView({
      bossUnitSetId,
      meta: catalog.meta,
      presentation: catalog.presentation,
      roster:
        characters && mows
          ? buildGuildRaidRosterInvestment({ characters, mows })
          : undefined,
      threshold,
    })
  }, [catalog, roster, bossUnitSetId, threshold])
}
