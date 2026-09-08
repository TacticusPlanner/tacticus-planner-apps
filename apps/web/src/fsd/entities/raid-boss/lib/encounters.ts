import type { RaidBossEncounter, RaidBossesPayload } from "../model/types"

/** Every encounter across every season/tier/set that targets the given unit-set id. */
export function findEncountersForUnit(
  raidBosses: RaidBossesPayload,
  unitSetId: string
): RaidBossEncounter[] {
  return Object.values(raidBosses.seasons)
    .flatMap((season) => season.tiers)
    .flatMap((tier) => tier.sets)
    .flatMap((set) => set.encounters)
    .filter((encounter) => encounter.unitSetId === unitSetId)
}

/** The highest progression step index a unit is ever fought at (falls back to the ladder's last step). */
export function maxKnownProgressionIndex(
  raidBosses: RaidBossesPayload,
  unitSetId: string,
  ladderLength: number
): number {
  const fromEncounters = findEncountersForUnit(raidBosses, unitSetId)
    .map((encounter) => encounter.progressionIndex)
    .filter((index) => Number.isFinite(index))

  const maxEncounterIndex = fromEncounters.length
    ? Math.max(...fromEncounters)
    : 0

  // Encounter progression indices are 1-based; clamp into the 0-based ladder.
  return Math.min(
    Math.max(maxEncounterIndex - 1, 0),
    Math.max(ladderLength - 1, 0)
  )
}
