import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  getPlayerCharacters,
  getPlayerMows,
} from "@workspace/player-data/queries"

import {
  buildGuildRaidExactReadinessView,
  type GuildRaidExactReadinessInvestment,
  type GuildRaidExactReadinessView,
} from "./build-guild-raid-exact-readiness-view"
import { resolveGuildRaidExactReadiness } from "./resolve-guild-raid-exact-readiness"
import { useGuildRaidMetaCatalog } from "./use-guild-raid-meta-presentation"

export type GuildRaidExactReadinessQuery =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | GuildRaidExactReadinessView

async function readOwnedRoster() {
  const [characters, mows] = await Promise.all([
    getPlayerCharacters(),
    getPlayerMows(),
  ])
  return { characters, mows }
}

/** Reactive public entity API for exact-Meta readiness against the current player's synced roster. */
export function useGuildRaidExactReadiness(
  bossUnitSetId: string
): GuildRaidExactReadinessQuery {
  const catalog = useGuildRaidMetaCatalog()
  const roster = useLiveQuery(readOwnedRoster, [])

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

    const isRosterSynced =
      roster !== undefined &&
      roster.characters !== undefined &&
      roster.mows !== undefined

    const readinessRoster = isRosterSynced
      ? {
          ownedCharacterIds: new Set(roster.characters!.map((c) => c.unitId)),
          ownedMowIds: new Set(roster.mows!.map((m) => m.unitId)),
        }
      : undefined

    const investmentByCharacterId = new Map<
      string,
      GuildRaidExactReadinessInvestment
    >(
      isRosterSynced
        ? roster.characters!.map((c) => [
            c.unitId,
            { xpLevel: c.xpLevel, rank: c.rank },
          ])
        : []
    )
    const investmentByMowId = new Map<
      string,
      GuildRaidExactReadinessInvestment
    >(
      isRosterSynced
        ? roster.mows!.map((m) => [m.unitId, { xpLevel: m.xpLevel }])
        : []
    )

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
