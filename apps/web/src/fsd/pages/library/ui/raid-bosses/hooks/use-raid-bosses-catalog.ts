import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  getCharactersMap,
  getRaidBosses,
} from "@workspace/game-catalog/queries"

import {
  resolvePrimeName,
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
  /** unit-set id -> resolved display label, for every boss and prime. */
  nameById: Map<string, string>
}

const LOADING = Symbol("loading")

const EMPTY: Omit<RaidBossesCatalog, "status"> = {
  payload: undefined,
  bosses: [],
  primes: [],
  byId: new Map(),
  nameById: new Map(),
}

/**
 * Reactive read of the synced `raid-bosses` catalog dataset, with each boss/prime's display label
 * resolved: a prime prefers its playable-character name from the roster (`GuildBoss4MiniBoss1OrksBigMek`
 * -> "Gibbascrapz"), falling back to the id-keyed i18n namespace, as V1 does. Distinguishes
 * still-syncing (`loading`) from never-synced (`absent`) so the page can show a feature-unavailable
 * state rather than an empty grid.
 */
export function useRaidBossesCatalog(): RaidBossesCatalog {
  const { bossName } = useRaidBossLabels()

  const result = useLiveQuery(() => getRaidBosses(), [], LOADING)
  const charactersById = useLiveQuery(() => getCharactersMap(), [], undefined)

  return useMemo<RaidBossesCatalog>(() => {
    if (result === LOADING) return { status: "loading", ...EMPTY }
    if (result === null) return { status: "absent", ...EMPTY }

    const nameFor = (unit: RaidBoss): string => {
      if (unit.kind === "prime" && charactersById) {
        const rosterName = resolvePrimeName(unit.unitSetId, charactersById)
        if (rosterName) return rosterName
      }
      return bossName(unit.unitSetId)
    }

    const nameById = new Map<string, string>()
    const toItem = (unit: RaidBoss): RaidBossListItem => {
      const name = nameFor(unit)
      nameById.set(unit.unitSetId, name)
      return {
        unitSetId: unit.unitSetId,
        kind: unit.kind,
        isPrimarch: unit.isPrimarch,
        factionId: unit.factionId,
        name,
      }
    }

    const bosses = result.bosses.map(toItem)
    const primes = result.primes.map(toItem)

    return {
      status: "ready",
      payload: result,
      bosses,
      primes,
      byId: new Map(
        [...result.bosses, ...result.primes].map((unit) => [
          unit.unitSetId,
          unit,
        ])
      ),
      nameById,
    }
  }, [result, charactersById, bossName])
}
