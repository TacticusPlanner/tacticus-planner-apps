import {
  firstRank,
  maxAbilityLevel,
  minProgressionForAbilityLevel,
  minProgressionForRank,
  progressionIndex,
  rankIndex,
  type Progression,
  type Rank,
  type UnitId,
} from "@workspace/game-domain"

import {
  goalTargetKeyOf,
  goalTypesOverLimit,
  type CombinedGoalSpec,
  type GoalDetail,
  type GoalKind,
} from "@/entities/goal"

/** A unit as Collection lists it: its current values, or where it starts when not owned. */
export type BulkGoalUnit = {
  kind: "character" | "mow"
  unitId: UnitId
  name: string
} & (
  | {
      owned: true
      progression: Progression
      /** Characters only. */
      rank?: Rank
      abilityLevels: readonly [number, number]
    }
  | { owned: false; startProgression: Progression }
)

/** The shared target; a null target type is not planned. */
export type BulkGoalTargets = {
  unlock: boolean
  ascension: Progression | null
  rank: Rank | null
  ability: number | null
}

type BulkSkipReason = "reached" | "alreadyGoal" | "notForMow" | "notOwned"

/** One goal a unit's plan creates, for the dialog to describe. */
export type BulkPlannedGoal =
  | { goalType: "Unlock" }
  | {
      goalType: "Ascension"
      start: Progression
      end: Progression
      /** Added because a Rank or Abilities target needs it. */
      added: boolean
    }
  | { goalType: "Rank"; start: Rank; end: Rank }
  | {
      goalType: "Ability"
      activeStart: number
      activeEnd: number
      passiveStart: number
      passiveEnd: number
    }

export type BulkUnitPlan = {
  unit: BulkGoalUnit
  goals: BulkPlannedGoal[]
  skipped: { goalType: GoalKind; reason: BulkSkipReason }[]
  /** The combined create request's specs, in order (empty: the unit is not sent). */
  specs: CombinedGoalSpec[]
}

export const bulkUnitKey = (unit: { kind: string; unitId: string }) =>
  `${unit.kind}:${unit.unitId}`

const entityTypeOf = (unit: BulkGoalUnit) =>
  unit.kind === "character" ? "Character" : "Mow"

const isInFlight = (goal: GoalDetail) =>
  goal.status === "Active" || goal.status === "Paused"

/** The in-flight goals of one unit. */
function unitGoals(goals: Iterable<GoalDetail>, unit: BulkGoalUnit) {
  const entityType = entityTypeOf(unit)
  const result: GoalDetail[] = []
  for (const goal of goals) {
    if (
      goal.entityType === entityType &&
      goal.entityId === unit.unitId &&
      isInFlight(goal)
    ) {
      result.push(goal)
    }
  }
  return result
}

const above = (a: Progression, b: Progression) =>
  progressionIndex(a) > progressionIndex(b)

/**
 * One unit's goals for the shared target, from its current values (an unowned unit's starting ones):
 * Unlock, Ascension, Rank, Abilities in that order, each depending on Unlock. A target not above the
 * current value is skipped as reached, one an in-flight goal of the unit and type holds as already a
 * goal, and Rank on a Machine of War as not for it. A Rank or Abilities target above the base
 * progression's cap depends on the chosen Ascension when it reaches far enough, else the lowest
 * in-flight Ascension that does, else an Ascension added for it (one, to the highest need).
 */
export function buildUnitPlan(
  unit: BulkGoalUnit,
  targets: BulkGoalTargets,
  existing: readonly GoalDetail[]
): BulkUnitPlan {
  const goals: BulkPlannedGoal[] = []
  const skipped: BulkUnitPlan["skipped"] = []
  const specs: CombinedGoalSpec[] = []
  const taken = (goalType: GoalKind, config: CombinedGoalSpec["config"]) => {
    const key = goalTargetKeyOf({ goalType, config })
    return existing.some(
      (goal) => goal.goalType === goalType && goalTargetKeyOf(goal) === key
    )
  }

  if (!unit.owned && !targets.unlock) {
    return {
      unit,
      goals,
      skipped: [{ goalType: "Unlock", reason: "notOwned" }],
      specs,
    }
  }

  const base = unit.owned ? unit.progression : unit.startProgression
  const rankStart = unit.owned ? (unit.rank ?? firstRank) : firstRank
  const [activeStart, passiveStart] = unit.owned ? unit.abilityLevels : [1, 1]

  let unlockIndex: number | null = null
  const unlockGoalIds: string[] = []
  if (!unit.owned) {
    const inFlightUnlock = existing.find((goal) => goal.goalType === "Unlock")
    if (inFlightUnlock) {
      unlockGoalIds.push(inFlightUnlock.goalId)
      skipped.push({ goalType: "Unlock", reason: "alreadyGoal" })
    } else {
      specs.push({ goalType: "Unlock", config: {}, dependsOnIndex: [] })
      goals.push({ goalType: "Unlock" })
      unlockIndex = 0
    }
  }
  const withUnlock = (indexes: (number | null)[]) =>
    [...new Set([unlockIndex, ...indexes])]
      .filter((index): index is number => index !== null)
      .sort((a, b) => a - b)

  // What each later target needs, computed before any spec so one added Ascension covers all.
  const rankEnd =
    targets.rank && unit.kind === "character" ? targets.rank : null
  const rankConfig = rankEnd
    ? {
        farmingStrategy: "TotalUpgrades" as const,
        rank: {
          start: rankIndex(rankStart),
          startPointFive: false,
          startAppliedUpgrades: 0,
          end: rankIndex(rankEnd),
          endPointFive: false,
          endAppliedUpgrades: 0,
        },
      }
    : null
  const plansRank =
    rankEnd !== null &&
    rankIndex(rankEnd) > rankIndex(rankStart) &&
    !taken("Rank", rankConfig!)

  const level =
    targets.ability === null
      ? null
      : Math.min(Math.max(targets.ability, 1), maxAbilityLevel)
  const abilityConfig =
    level === null
      ? null
      : {
          farmingStrategy: "TotalUpgrades" as const,
          ability: {
            activeStart,
            activeEnd: Math.max(activeStart, level),
            passiveStart,
            passiveEnd: Math.max(passiveStart, level),
          },
        }
  const plansAbility =
    level !== null &&
    (level > activeStart || level > passiveStart) &&
    !taken("Ability", abilityConfig!)

  const needs = [
    plansRank ? minProgressionForRank(rankEnd) : null,
    plansAbility ? minProgressionForAbilityLevel(level) : null,
  ].filter((need): need is Progression => need !== null && above(need, base))
  const highestNeed = needs.reduce<Progression | null>(
    (highest, need) => (highest && !above(need, highest) ? highest : need),
    null
  )

  // This request's Ascension goals, in order: the chosen one, then one added for Rank/Abilities.
  const ascensions: { index: number; end: Progression }[] = []
  const pushAscension = (end: Progression, added: boolean) => {
    const previous = ascensions.at(-1)?.index ?? null
    specs.push({
      goalType: "Ascension",
      config: { progression: { start: base, end } },
      dependsOnIndex: withUnlock([previous]),
      ...(unlockGoalIds.length > 0 ? { dependsOnGoalIds: unlockGoalIds } : {}),
    })
    goals.push({ goalType: "Ascension", start: base, end, added })
    ascensions.push({ index: specs.length - 1, end })
  }
  if (targets.ascension) {
    const config = { progression: { start: base, end: targets.ascension } }
    if (!above(targets.ascension, base)) {
      skipped.push({ goalType: "Ascension", reason: "reached" })
    } else if (taken("Ascension", config)) {
      skipped.push({ goalType: "Ascension", reason: "alreadyGoal" })
    } else {
      pushAscension(targets.ascension, false)
    }
  }
  const inFlightAscensions = existing
    .filter((goal) => goal.goalType === "Ascension" && goal.config.progression)
    .map((goal) => ({
      goalId: goal.goalId,
      end: goal.config.progression!.end,
    }))
    .sort((a, b) => progressionIndex(a.end) - progressionIndex(b.end))
  // Where a target needing `need` gets it: this request's lowest Ascension that reaches it, the
  // lowest in-flight one that does, else an Ascension added to the highest need of this plan.
  const dependencyFor = (
    need: Progression
  ): { index: number | null; goalIds: string[] } => {
    if (!above(need, base)) return { index: null, goalIds: [] }
    const reaches = (ascension: { end: Progression }) =>
      !above(need, ascension.end)
    const inRequest = ascensions.find(reaches)
    if (inRequest) return { index: inRequest.index, goalIds: [] }
    const inFlight = inFlightAscensions.find(reaches)
    if (inFlight) return { index: null, goalIds: [inFlight.goalId] }
    pushAscension(highestNeed ?? need, true)
    return { index: ascensions.at(-1)!.index, goalIds: [] }
  }
  const dependsOnGoalIds = (goalIds: string[]) => {
    const all = [...new Set([...unlockGoalIds, ...goalIds])]
    return all.length > 0 ? { dependsOnGoalIds: all } : {}
  }

  if (targets.rank) {
    if (unit.kind === "mow") {
      skipped.push({ goalType: "Rank", reason: "notForMow" })
    } else if (rankIndex(targets.rank) <= rankIndex(rankStart)) {
      skipped.push({ goalType: "Rank", reason: "reached" })
    } else if (!plansRank) {
      skipped.push({ goalType: "Rank", reason: "alreadyGoal" })
    } else {
      const dependency = dependencyFor(minProgressionForRank(rankEnd))
      specs.push({
        goalType: "Rank",
        config: rankConfig!,
        dependsOnIndex: withUnlock([dependency.index]),
        ...dependsOnGoalIds(dependency.goalIds),
      })
      goals.push({ goalType: "Rank", start: rankStart, end: rankEnd })
    }
  }

  if (level !== null) {
    if (level <= activeStart && level <= passiveStart) {
      skipped.push({ goalType: "Ability", reason: "reached" })
    } else if (!plansAbility) {
      skipped.push({ goalType: "Ability", reason: "alreadyGoal" })
    } else {
      const dependency = dependencyFor(minProgressionForAbilityLevel(level))
      specs.push({
        goalType: "Ability",
        config: abilityConfig!,
        dependsOnIndex: withUnlock([dependency.index]),
        ...dependsOnGoalIds(dependency.goalIds),
      })
      goals.push({ goalType: "Ability", ...abilityConfig!.ability })
    }
  }

  return { unit, goals, skipped, specs }
}

/** Every unit's plan, in the given order, against the account's goals. */
export function buildBulkGoalPlans(
  units: readonly BulkGoalUnit[],
  targets: BulkGoalTargets,
  goals: Iterable<GoalDetail>
): BulkUnitPlan[] {
  const all = [...goals]
  return units.map((unit) => buildUnitPlan(unit, targets, unitGoals(all, unit)))
}

/** The goal types the plans would push past the per-type cap, given the account's non-archived goals. */
export function bulkPlanTypesOverLimit(
  plans: readonly BulkUnitPlan[],
  goals: Iterable<GoalDetail>
): GoalKind[] {
  return goalTypesOverLimit(
    [...goals].filter((goal) => goal.status !== "Archived"),
    plans.flatMap((plan) => plan.specs.map((spec) => spec.goalType))
  )
}
