import type {
  ModifierContext,
  RaidBoss,
  RaidBossEncounter,
  RaidBossesPayload,
} from "../model/types"

type EncounterSlot = {
  encounter: RaidBossEncounter
  /** Every encounter in the containing set — a boss encounter plus its two `Crystal` prime encounters. */
  setEncounters: RaidBossEncounter[]
}

/** Every (encounter, containing-set) pair across the rotation that targets the given unit-set id. */
function findEncounterSlots(
  raidBosses: RaidBossesPayload,
  unitSetId: string
): EncounterSlot[] {
  const slots: EncounterSlot[] = []
  for (const season of Object.values(raidBosses.seasons)) {
    for (const tier of season.tiers) {
      for (const set of tier.sets) {
        for (const encounter of set.encounters) {
          if (encounter.unitSetId === unitSetId) {
            slots.push({ encounter, setEncounters: set.encounters })
          }
        }
      }
    }
  }
  return slots
}

/** Every encounter across every season/tier/set that targets the given unit-set id. */
export function findEncountersForUnit(
  raidBosses: RaidBossesPayload,
  unitSetId: string
): RaidBossEncounter[] {
  return findEncounterSlots(raidBosses, unitSetId).map((slot) => slot.encounter)
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

// Picks the slot whose encounter is fought closest to (at or below) the viewed progression step, so
// the modifier context tracks the stepper. Exact match wins; otherwise the highest step not exceeding
// it; otherwise the first slot (e.g. Lion has no low-rarity fights).
function pickSlot(
  slots: EncounterSlot[],
  progressionIndex: number
): EncounterSlot | undefined {
  if (slots.length === 0) return undefined
  const exact = slots.find(
    (slot) => slot.encounter.progressionIndex === progressionIndex
  )
  if (exact) return exact
  const atOrBelow = slots
    .filter((slot) => slot.encounter.progressionIndex <= progressionIndex)
    .sort((a, b) => b.encounter.progressionIndex - a.encounter.progressionIndex)
  return atOrBelow[0] ?? slots[0]
}

/**
 * The modifier information a detail view shows for `unit` at the given 0-based ladder step: for a boss,
 * the primes it is fought alongside (its set's two `Crystal` encounters) with each prime's scaled
 * modifiers; for a prime, its own modifiers. `primeName` resolves a prime unit-set id to a label.
 */
export function buildModifierContext(
  raidBosses: RaidBossesPayload,
  unit: RaidBoss,
  stepIndex: number,
  primeName: (unitSetId: string) => string
): ModifierContext {
  const slot = pickSlot(
    findEncounterSlots(raidBosses, unit.unitSetId),
    stepIndex + 1
  )
  if (!slot) return { kind: "none" }

  if (unit.kind === "prime") {
    return { kind: "prime", modifiers: slot.encounter.modifiers }
  }

  const primes = slot.setEncounters
    .filter((encounter) => encounter.encounterType === "Crystal")
    .sort((a, b) => a.encounterIndex - b.encounterIndex)
    .map((encounter) => ({
      unitSetId: encounter.unitSetId,
      name: primeName(encounter.unitSetId),
      modifiers: encounter.modifiers,
    }))

  return { kind: "boss", primes }
}

/** The representative encounter's field-npc ids for `unit` at the given step (empty when none). */
export function fieldNpcIdsForStep(
  raidBosses: RaidBossesPayload,
  unitSetId: string,
  stepIndex: number
): string[] {
  const slot = pickSlot(
    findEncounterSlots(raidBosses, unitSetId),
    stepIndex + 1
  )
  return slot?.encounter.fieldNpcIds ?? []
}
