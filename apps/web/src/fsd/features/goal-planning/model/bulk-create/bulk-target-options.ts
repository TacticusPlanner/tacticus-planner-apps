import {
  firstRank,
  maxAbilityLevel,
  progressionIndex,
  progressionOrder,
  rankIndex,
  rankOrder,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import type { BulkGoalUnit } from "./bulk-goal-plan"

/** What the bulk dialog's target pickers offer for the listed units. */
type BulkTargetOptions = {
  /** Ranks above the lowest current rank of the listed characters. */
  rankOptions: Rank[]
  /** Progressions above the lowest current progression of the listed units. */
  progressionOptions: Progression[]
  /** The lowest ability level above every listed unit's lower track; null when all are at the cap. */
  abilityMin: number | null
}

/**
 * Each picker starts one step above the lowest current value among the listed units, so it never offers
 * a target every unit has already reached. An unowned unit counts from its starting values (Stone I,
 * its starting rarity, level 1). Rank looks at characters only.
 */
export function bulkTargetOptions(
  units: readonly BulkGoalUnit[]
): BulkTargetOptions {
  if (units.length === 0) {
    return {
      rankOptions: [...rankOrder],
      progressionOptions: [...progressionOrder],
      abilityMin: 1,
    }
  }

  const rankFloors = units
    .filter((unit) => unit.kind === "character")
    .map((unit) => rankIndex(unit.owned ? (unit.rank ?? firstRank) : firstRank))
  const rankFloor = Math.min(...rankFloors)
  const progressionFloor = Math.min(
    ...units.map((unit) =>
      progressionIndex(unit.owned ? unit.progression : unit.startProgression)
    )
  )
  const abilityFloor = Math.min(
    ...units.map((unit) => (unit.owned ? Math.min(...unit.abilityLevels) : 1))
  )

  return {
    rankOptions:
      rankFloors.length === 0
        ? []
        : rankOrder.filter((rank) => rankIndex(rank) > rankFloor),
    progressionOptions: progressionOrder.filter(
      (progression) => progressionIndex(progression) > progressionFloor
    ),
    abilityMin: abilityFloor < maxAbilityLevel ? abilityFloor + 1 : null,
  }
}

/** The chosen value, or the first offered one when the chosen value is below it (or none is chosen). */
export function snapUp<T>(
  value: T,
  options: readonly T[],
  index: (value: T) => number
): T | null {
  const first = options[0]
  if (first === undefined) return null
  return index(value) < index(first) ? first : value
}
