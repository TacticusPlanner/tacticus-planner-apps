import { useMemo } from "react"

import { combineReadStates } from "@/shared/lib"
import { usePlayerChunk } from "@/shared/local-data"

import {
  buildGuildRaidExactReadinessView,
  buildGuildRaidRosterInvestment,
  type GuildRaidExactReadinessView,
} from "./build-guild-raid-exact-readiness-view"
import { resolveGuildRaidExactReadiness } from "./resolve-guild-raid-exact-readiness"
import { useGuildRaidMetaCatalog } from "./use-guild-raid-meta-presentation"

export type GuildRaidExactReadinessQuery =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | GuildRaidExactReadinessView

/** Reactive public entity API for exact-Meta readiness against the current player's synced roster. */
export function useGuildRaidExactReadiness(
  bossUnitSetId: string
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

    // An unsynced chunk reads as null: readiness is then resolved without a roster.
    const [characters, mows] = roster.data
    const investment =
      characters && mows
        ? buildGuildRaidRosterInvestment({ characters, mows })
        : undefined

    const readinessRoster = investment
      ? {
          ownedCharacterIds: investment.ownedCharacterIds,
          ownedMowIds: investment.ownedMowIds,
        }
      : undefined

    const investmentByCharacterId =
      investment?.investmentByCharacterId ?? new Map()
    const investmentByMowId = investment?.investmentByMowId ?? new Map()

    const readiness = resolveGuildRaidExactReadiness({
      bossUnitSetId,
      meta: catalog.meta,
      roster: readinessRoster,
    })

    return buildGuildRaidExactReadinessView({
      readiness,
      presentation: catalog.presentation,
      meta: catalog.meta,
      investmentByCharacterId,
      investmentByMowId,
    })
  }, [catalog, roster, bossUnitSetId])
}
