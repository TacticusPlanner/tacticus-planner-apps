import type {
  AdjustedStatsView,
  ModifierContext,
  RaidBoss,
  RaidBossEncounter,
  RaidBossEncounterModifier,
  RaidBossesPayload,
  ResolvedRaidBossEncounterLocation,
} from "../model/types"
import {
  buildModifierHpLostOptions,
  computeStatAdjustments,
  computeUnitRemovals,
  getActiveModifiers,
  applyUnitRemovals,
  scaleModifierHpLost,
  sortModifiersByHpLost,
} from "./modifier-math"

type EncounterSlot = {
  encounter: RaidBossEncounter
  /** Every encounter in the containing set — a boss encounter plus its two `Crystal` prime encounters. */
  setEncounters: RaidBossEncounter[]
}

function slotFor(
  exact: ResolvedRaidBossEncounterLocation | undefined,
  fallback: () => EncounterSlot | undefined
): EncounterSlot | undefined {
  return exact
    ? { encounter: exact.encounter, setEncounters: exact.setEncounters }
    : fallback()
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
  primeName: (unitSetId: string) => string,
  exact?: ResolvedRaidBossEncounterLocation
): ModifierContext {
  const slot = slotFor(exact, () =>
    pickSlot(findEncounterSlots(raidBosses, unit.unitSetId), stepIndex + 1)
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
  stepIndex: number,
  exact?: ResolvedRaidBossEncounterLocation
): string[] {
  const slot = slotFor(exact, () =>
    pickSlot(findEncounterSlots(raidBosses, unitSetId), stepIndex + 1)
  )
  return slot?.encounter.fieldNpcIds ?? []
}

const stepHealthAt = (unit: RaidBoss, stepIndex: number): number => {
  const ladder = unit.statProgression
  const step =
    ladder[Math.min(Math.max(stepIndex, 0), Math.max(ladder.length - 1, 0))]
  return step?.health ?? 0
}

/**
 * The adjusted-stats model for a **boss** at the viewed step: one panel per prime it is fought
 * alongside (that prime's modifier schedule rescaled to the prime's own HP), and — for the HP-lost
 * point chosen per prime in `hpLostByPrime` — the combined stat adjustments, the combined active
 * modifier list (for recomputing ability variables), and the boss's field enemies with
 * `unitAmountDecrease` removals applied. Returns `null` for a prime, or a boss with no resolved
 * encounter (V1 shows the adjusted view for bosses only).
 */
export function buildAdjustedView(
  raidBosses: RaidBossesPayload,
  unit: RaidBoss,
  stepIndex: number,
  hpLostByPrime: Record<string, number>,
  exact?: ResolvedRaidBossEncounterLocation
): AdjustedStatsView | null {
  if (unit.kind !== "boss") return null

  const slot = slotFor(exact, () =>
    pickSlot(findEncounterSlots(raidBosses, unit.unitSetId), stepIndex + 1)
  )
  if (!slot) return null

  const primeById = new Map(raidBosses.primes.map((p) => [p.unitSetId, p]))
  const crystalEncounters = slot.setEncounters
    .filter((encounter) => encounter.encounterType === "Crystal")
    .sort((a, b) => a.encounterIndex - b.encounterIndex)

  const primes = crystalEncounters.map((encounter) => {
    const prime = primeById.get(encounter.unitSetId)
    const totalHp = prime ? stepHealthAt(prime, stepIndex) : 0
    const scaledModifiers = scaleModifierHpLost(
      sortModifiersByHpLost(encounter.modifiers),
      totalHp
    )
    return {
      id: String(encounter.encounterIndex),
      unitSetId: encounter.unitSetId,
      totalHp,
      scaledModifiers,
      hpLostPoints: buildModifierHpLostOptions(scaledModifiers),
    }
  })

  const activeModifiers: RaidBossEncounterModifier[] = primes.flatMap((panel) =>
    getActiveModifiers(panel.scaledModifiers, hpLostByPrime[panel.id] ?? 0)
  )

  const enemies = applyUnitRemovals(
    slot.encounter.fieldNpcIds,
    computeUnitRemovals(activeModifiers)
  )

  return {
    primes,
    activeModifiers,
    statAdjustments: computeStatAdjustments(activeModifiers),
    enemies,
  }
}
