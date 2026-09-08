import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { getRaidBosses } from "@workspace/game-catalog/queries"

import {
  useRaidBossLabels,
  type RaidBoss,
  type RaidBossesPayload,
  type RaidBossListItem,
} from "@/entities/raid-boss"

type RaidBossesCatalogStatus = "loading" | "absent" | "ready"

export type RaidBossesCatalog = {
  status: RaidBossesCatalogStatus
  payload: RaidBossesPayload | undefined
  bosses: RaidBossListItem[]
  primes: RaidBossListItem[]
  byId: Map<string, RaidBoss>
}

const LOADING = Symbol("loading")

/**
 * Reactive read of the synced `raid-bosses` catalog dataset, with each boss/prime's display label
 * resolved. Distinguishes still-syncing (`loading`) from never-synced (`absent`, `getRaidBosses()`
 * returns `null`) so the page can show a feature-unavailable state rather than an empty grid.
 */
export function useRaidBossesCatalog(): RaidBossesCatalog {
  const { bossName } = useRaidBossLabels()

  const result = useLiveQuery(() => getRaidBosses(), [], LOADING)

  return useMemo<RaidBossesCatalog>(() => {
    if (result === LOADING) {
      return {
        status: "loading",
        payload: undefined,
        bosses: [],
        primes: [],
        byId: new Map(),
      }
    }

    if (result === null) {
      return {
        status: "absent",
        payload: undefined,
        bosses: [],
        primes: [],
        byId: new Map(),
      }
    }

    const toItem = (unit: RaidBoss): RaidBossListItem => ({
      unitSetId: unit.unitSetId,
      kind: unit.kind,
      isPrimarch: unit.isPrimarch,
      factionId: unit.factionId,
      name: bossName(unit.unitSetId),
    })

    const all = [...result.bosses, ...result.primes]

    return {
      status: "ready",
      payload: result,
      bosses: result.bosses.map(toItem),
      primes: result.primes.map(toItem),
      byId: new Map(all.map((unit) => [unit.unitSetId, unit])),
    }
  }, [result, bossName])
}
