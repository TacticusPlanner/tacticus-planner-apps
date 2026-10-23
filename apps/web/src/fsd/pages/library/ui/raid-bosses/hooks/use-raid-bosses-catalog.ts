import { useMemo } from "react"
import { raidBossPortrait } from "@workspace/game-catalog"

import {
  buildRaidBossRosterGroups,
  resolvePrimeCharacterId,
  resolvePrimeName,
  useRaidBossLabels,
  type RaidBoss,
  type RaidBossesPayload,
  type RaidBossListItem,
} from "@/entities/raid-boss"
import { toById, useCatalogDataset } from "@/shared/local-data"

type RaidBossesCatalogStatus = "loading" | "absent" | "failed" | "ready"

export type RaidBossesCatalog = {
  status: RaidBossesCatalogStatus
  payload: RaidBossesPayload | undefined
  bosses: RaidBossListItem[]
  primes: RaidBossListItem[]
  /** One group per boss, in served boss order, for the mobile roster picker. */
  rosterGroups: { boss: RaidBossListItem; primes: RaidBossListItem[] }[]
  byId: Map<string, RaidBoss>
  /** unit-set id -> resolved display label, for every boss and prime. */
  nameById: Map<string, string>
  /** unit-set id -> resolved round-portrait URL; only present for ids that resolve to an asset. */
  portraitById: Map<string, string>
  /** Re-runs the dataset read; meaningful only in the `failed` state. */
  retry: () => void
}

// raid-bosses is stored as a single row; `null` means the dataset has never synced into this client.
function firstRecord<T>(records: T[]): T | null {
  return records[0] ?? null
}

const EMPTY: Omit<RaidBossesCatalog, "status" | "retry"> = {
  payload: undefined,
  bosses: [],
  primes: [],
  rosterGroups: [],
  byId: new Map(),
  nameById: new Map(),
  portraitById: new Map(),
}

/**
 * The synced `raid-bosses` catalog dataset, with each boss/prime's display label
 * resolved: a prime prefers its playable-character name from the roster (`GuildBoss4MiniBoss1OrksBigMek`
 * -> "Gibbascrapz"), falling back to the id-keyed i18n namespace, as V1 does. Distinguishes
 * still-syncing (`loading`) from never-synced (`absent`) so the page can show a feature-unavailable
 * state rather than an empty grid.
 */
export function useRaidBossesCatalog(): RaidBossesCatalog {
  const { bossName } = useRaidBossLabels()
  const read = useCatalogDataset("raid-bosses", firstRecord)
  // Only refines prime labels and portraits, so it neither blocks nor fails the page.
  const characters = useCatalogDataset("characters", toById)
  const charactersById =
    characters.status === "ready" ? characters.data : undefined
  const { retry } = read

  return useMemo<RaidBossesCatalog>(() => {
    if (read.status === "loading") return { status: "loading", ...EMPTY, retry }
    if (read.status === "error") return { status: "failed", ...EMPTY, retry }
    const result = read.data
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
    const itemByUnitSetId = new Map(
      [...bosses, ...primes].map((item) => [item.unitSetId, item])
    )
    const rosterGroups = buildRaidBossRosterGroups(result).map((group) => ({
      boss: itemByUnitSetId.get(group.boss.unitSetId)!,
      primes: group.primes.map((prime) =>
        itemByUnitSetId.get(prime.unitSetId)!
      ),
    }))

    return {
      status: "ready",
      payload: result,
      bosses,
      primes,
      rosterGroups,
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
  }, [read, retry, charactersById, bossName])
}
