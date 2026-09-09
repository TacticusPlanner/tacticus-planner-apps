import { useMemo, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { raidBossPortrait } from "@workspace/game-catalog"
import {
  getCharactersMap,
  getRaidBosses,
} from "@workspace/game-catalog/queries"

import {
  resolvePrimeCharacterId,
  resolvePrimeName,
  useRaidBossLabels,
  type RaidBoss,
  type RaidBossesPayload,
  type RaidBossListItem,
} from "@/entities/raid-boss"

type RaidBossesCatalogStatus = "loading" | "absent" | "failed" | "ready"

export type RaidBossesCatalog = {
  status: RaidBossesCatalogStatus
  payload: RaidBossesPayload | undefined
  bosses: RaidBossListItem[]
  primes: RaidBossListItem[]
  byId: Map<string, RaidBoss>
  /** unit-set id -> resolved display label, for every boss and prime. */
  nameById: Map<string, string>
  /** unit-set id -> resolved round-portrait URL; only present for ids that resolve to an asset. */
  portraitById: Map<string, string>
  /** Re-runs the dataset read; meaningful only in the `failed` state. */
  retry: () => void
}

const FAILED = Symbol("failed")

const EMPTY: Omit<RaidBossesCatalog, "status" | "retry"> = {
  payload: undefined,
  bosses: [],
  primes: [],
  byId: new Map(),
  nameById: new Map(),
  portraitById: new Map(),
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
  const [retryNonce, setRetryNonce] = useState(0)
  const retry = () => setRetryNonce((value) => value + 1)

  // `useLiveQuery` swallows a thrown error into `undefined` forever — indistinguishable from
  // "still loading". Wrapping the read lets the page show a real, retry-able failure state.
  const result = useLiveQuery(async () => {
    try {
      return await getRaidBosses()
    } catch {
      return FAILED
    }
  }, [retryNonce])
  const charactersById = useLiveQuery(() => getCharactersMap(), [], undefined)

  return useMemo<RaidBossesCatalog>(() => {
    if (result === undefined) return { status: "loading", ...EMPTY, retry }
    if (result === FAILED) return { status: "failed", ...EMPTY, retry }
    if (result === null) return { status: "absent", ...EMPTY, retry }

    const nameFor = (unit: RaidBoss): string => {
      if (unit.kind === "prime" && charactersById) {
        const rosterName = resolvePrimeName(unit.unitSetId, charactersById)
        if (rosterName) return rosterName
      }
      return bossName(unit.unitSetId)
    }

    const nameById = new Map<string, string>()
    const portraitById = new Map<string, string>()
    const toItem = (unit: RaidBoss): RaidBossListItem => {
      const name = nameFor(unit)
      nameById.set(unit.unitSetId, name)

      const rosterId =
        unit.kind === "prime" && charactersById
          ? resolvePrimeCharacterId(unit.unitSetId, charactersById)
          : undefined
      const portrait = raidBossPortrait(unit.unitSetId, rosterId)
      if (portrait) portraitById.set(unit.unitSetId, portrait)

      return {
        unitSetId: unit.unitSetId,
        kind: unit.kind,
        isPrimarch: unit.isPrimarch,
        factionId: unit.factionId,
        name,
        portraitSrc: portrait,
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
      portraitById,
      retry,
    }
  }, [result, charactersById, bossName])
}
