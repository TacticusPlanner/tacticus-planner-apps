import { useMemo } from "react"

import {
  maxAbilityLevel,
  progressionIndex,
  progressionOrder,
  rankIndex,
  rankOrder,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import {
  goalTargetKeyOf,
  useGoalsById,
  type GoalDetail,
  type GoalKind,
} from "@/entities/goal"

/** The target keys (`goalTargetKey`) in-flight goals of one unit already hold, per goal type. */
export type TakenTargets = ReadonlyMap<GoalKind, ReadonlySet<string>>

export type AbilityTargetPair = { active: number; passive: number }

const NONE: ReadonlySet<string> = new Set()

/** The key a Rank target at a clean boundary (no additional target) has. */
export const rankEndKey = (rank: Rank) =>
  goalTargetKeyOf({
    goalType: "Rank",
    config: {
      rank: {
        start: 0,
        startPointFive: false,
        startAppliedUpgrades: 0,
        end: rankIndex(rank),
        endPointFive: false,
        endAppliedUpgrades: 0,
      },
    },
  })!

const abilityPairKey = (start: AbilityTargetPair, end: AbilityTargetPair) =>
  goalTargetKeyOf({
    goalType: "Ability",
    config: {
      ability: {
        activeStart: start.active,
        activeEnd: end.active,
        passiveStart: start.passive,
        passiveEnd: end.passive,
      },
    },
  })!

function firstFree<T>(
  candidates: readonly T[],
  keyOf: (candidate: T) => string,
  taken: ReadonlySet<string>
): T | undefined {
  return (
    candidates.find((candidate) => !taken.has(keyOf(candidate))) ??
    candidates[0]
  )
}

/**
 * The default target when a goal type is enabled: the first step above `start` that no in-flight goal of
 * the same unit and type holds, else the first step above `start` (the slot conflict then shows). Ability
 * raises both tracks by the same number of levels (each clamped to the maximum). With nothing above the
 * start, the start itself stands in (the type's toggle is disabled then anyway).
 */
export function firstFreeTarget(
  kind: "Rank",
  start: Rank,
  taken: ReadonlySet<string>
): Rank
export function firstFreeTarget(
  kind: "Ascension",
  start: Progression,
  taken: ReadonlySet<string>
): Progression
export function firstFreeTarget(
  kind: "Ability",
  start: AbilityTargetPair,
  taken: ReadonlySet<string>
): AbilityTargetPair
export function firstFreeTarget(
  kind: "Rank" | "Ascension" | "Ability",
  start: Rank | Progression | AbilityTargetPair,
  taken: ReadonlySet<string>
): Rank | Progression | AbilityTargetPair {
  switch (kind) {
    case "Rank": {
      const from = rankIndex(start as Rank)
      const above = rankOrder.filter((rank) => rankIndex(rank) > from)
      return firstFree(above, rankEndKey, taken) ?? start
    }
    case "Ascension": {
      const from = progressionIndex(start as Progression)
      const above = progressionOrder.filter(
        (step) => progressionIndex(step) > from
      )
      return firstFree(above, (step) => step, taken) ?? start
    }
    case "Ability": {
      const pair = start as AbilityTargetPair
      const steps = maxAbilityLevel - Math.min(pair.active, pair.passive)
      const above = Array.from({ length: Math.max(0, steps) }, (_, i) => ({
        active: Math.min(pair.active + i + 1, maxAbilityLevel),
        passive: Math.min(pair.passive + i + 1, maxAbilityLevel),
      }))
      return firstFree(above, (end) => abilityPairKey(pair, end), taken) ?? pair
    }
  }
}

const isInFlight = (goal: GoalDetail) =>
  goal.status === "Active" || goal.status === "Paused"

/** Pure core of {@link useTakenTargets}. */
export function takenTargetsOf(
  goals: Iterable<GoalDetail>,
  entityType: "Character" | "Mow",
  entityId: string | undefined
): { taken: TakenTargets; unlockGoal: GoalDetail | undefined } {
  const taken = new Map<GoalKind, Set<string>>()
  let unlockGoal: GoalDetail | undefined
  if (!entityId) return { taken, unlockGoal }
  for (const goal of goals) {
    if (
      goal.entityType !== entityType ||
      goal.entityId !== entityId ||
      !isInFlight(goal)
    ) {
      continue
    }
    if (goal.goalType === "Unlock") unlockGoal ??= goal
    const key = goalTargetKeyOf(goal)
    if (key === null) continue
    const keys = taken.get(goal.goalType) ?? new Set<string>()
    keys.add(key)
    taken.set(goal.goalType, keys)
  }
  return { taken, unlockGoal }
}

/** The account's in-flight targets for one unit, and its in-flight Unlock goal if it has one. */
export function useTakenTargets(
  entityType: "Character" | "Mow",
  entityId: string | undefined
) {
  const { goalsById } = useGoalsById()
  return useMemo(() => {
    const result = takenTargetsOf(goalsById.values(), entityType, entityId)
    return {
      ...result,
      takenFor: (kind: GoalKind) => result.taken.get(kind) ?? NONE,
    }
  }, [goalsById, entityType, entityId])
}
