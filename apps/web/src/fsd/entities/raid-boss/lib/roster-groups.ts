import type { RaidBoss, RaidBossesPayload } from "../model/types"

/** One boss and the primes it is fought alongside, for the mobile roster picker. */
export type RaidBossRosterGroup = {
  boss: RaidBoss
  primes: RaidBoss[]
}

/**
 * Groups every served boss with the primes it is fought alongside, in served boss order: for each
 * boss, every set across the rotation that contains one of its encounters contributes that set's
 * `Crystal` encounter unit-set ids, deduped and kept in first-seen (encounter) order, then resolved
 * to their `RaidBoss` record. Mirrors the set-walking `findEncounterSlots` does in `encounters.ts`.
 * A prime with no boss set referencing it is simply absent from every group (see design.md — treated
 * as a data bug, not a supported UI state).
 */
export function buildRaidBossRosterGroups(
  payload: RaidBossesPayload
): RaidBossRosterGroup[] {
  const primeById = new Map(
    payload.primes.map((prime) => [prime.unitSetId, prime])
  )

  return payload.bosses.map((boss) => {
    const primeIds: string[] = []
    const seen = new Set<string>()

    for (const season of Object.values(payload.seasons)) {
      for (const tier of season.tiers) {
        for (const set of tier.sets) {
          const hasBoss = set.encounters.some(
            (encounter) => encounter.unitSetId === boss.unitSetId
          )
          if (!hasBoss) continue

          const crystalEncounters = set.encounters
            .filter((encounter) => encounter.encounterType === "Crystal")
            .sort((a, b) => a.encounterIndex - b.encounterIndex)

          for (const encounter of crystalEncounters) {
            if (seen.has(encounter.unitSetId)) continue
            seen.add(encounter.unitSetId)
            primeIds.push(encounter.unitSetId)
          }
        }
      }
    }

    const primes = primeIds
      .map((id) => primeById.get(id))
      .filter((prime): prime is RaidBoss => prime !== undefined)

    return { boss, primes }
  })
}
