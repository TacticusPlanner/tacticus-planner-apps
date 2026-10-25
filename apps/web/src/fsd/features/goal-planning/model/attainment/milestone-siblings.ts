import {
  progressionIndex,
  progressionOrder,
  rankAt,
  rankIndex,
} from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"

import type { GoalProgress } from "./goal-progress"

// A unit's in-flight goals of one type form a ladder of milestones (goal-milestone-planning): each row
// reads its range from the previous milestone's end, and a milestone a higher-priority sibling already
// reaches is covered by it. Display only — stored starts and the plan allocation are untouched.

const isInFlight = (goal: GoalDetail) =>
  goal.status === "Active" || goal.status === "Paused"

/** A goal's end target as per-dimension scores: one for Rank (rank, then its additional slots) and
 *  Ascension, two (active, passive) for Ability. Null for a type without a ladder, or a goal without
 *  its target group. */
function endScores(goal: GoalDetail): number[] | null {
  const { rank, progression, ability } = goal.config
  switch (goal.goalType) {
    case "Rank":
      return rank
        ? [
            rank.end * 10 +
              (rank.endAppliedUpgrades || (rank.endPointFive ? 3 : 0)),
          ]
        : null
    case "Ascension":
      return progression ? [progressionIndex(progression.end)] : null
    case "Ability":
      return ability ? [ability.activeEnd, ability.passiveEnd] : null
    default:
      return null
  }
}

export type MilestoneSiblings = {
  /** The higher-priority in-flight sibling whose end reaches this goal's end on every dimension. */
  coveredBy: GoalDetail | null
  /** The ends of the nearest higher-priority sibling below this goal's end (none of its dimensions
   *  above, at least one below) — where this milestone's own range starts (nulls when none is below). */
  previousEnds: (number | null)[]
}

/**
 * The ladder context of `goal` among `goals` (the account's goals list): its in-flight, same-unit,
 * same-type siblings ahead of it in the global order. Null for a goal outside a ladder (Unlock,
 * Upgrade, a completed goal, or no global priority).
 */
export function milestoneSiblings(
  goal: GoalDetail,
  goals: Iterable<GoalDetail>
): MilestoneSiblings | null {
  const own = endScores(goal)
  if (!own || !isInFlight(goal) || goal.globalPriority === null) return null
  const priority = goal.globalPriority

  const ahead = [...goals]
    .filter(
      (sibling) =>
        sibling.goalId !== goal.goalId &&
        sibling.entityType === goal.entityType &&
        sibling.entityId === goal.entityId &&
        sibling.goalType === goal.goalType &&
        isInFlight(sibling) &&
        sibling.globalPriority !== null &&
        sibling.globalPriority < priority
    )
    .sort(
      (left, right) => (left.globalPriority ?? 0) - (right.globalPriority ?? 0)
    )

  let coveredBy: GoalDetail | null = null
  let previousEnds: (number | null)[] = own.map(() => null)
  let previousTotal = -1
  for (const sibling of ahead) {
    const scores = endScores(sibling)
    if (!scores) continue
    if (
      !coveredBy &&
      scores.every((score, index) => score >= (own[index] ?? 0))
    ) {
      coveredBy = sibling
    }
    // The nearest sibling below this goal: no dimension above it and at least one below. One goal
    // supplies every dimension, so a two-track Ability start is always some goal's actual end.
    // On a tie the later (nearest-priority) sibling wins.
    const below =
      scores.every((score, index) => score <= (own[index] ?? 0)) &&
      scores.some((score, index) => score < (own[index] ?? 0))
    const total = scores.reduce((sum, score) => sum + score, 0)
    if (below && total >= previousTotal) {
      previousEnds = scores
      previousTotal = total
    }
  }
  return { coveredBy, previousEnds }
}

/** `progress` with its displayed start moved up to the previous milestone's end wherever that end is
 *  above the live state, so a ladder reads Silver2 → Gold1, Gold1 → Diamond3, …. The ratio is unchanged. */
export function withMilestoneStart(
  progress: GoalProgress,
  siblings: MilestoneSiblings | null
): GoalProgress {
  const [first = null, second = null] = siblings?.previousEnds ?? []
  switch (progress.kind) {
    case "Rank": {
      const previous = first === null ? -1 : Math.floor(first / 10)
      return previous > rankIndex(progress.current)
        ? { ...progress, current: rankAt(previous) }
        : progress
    }
    case "Ascension": {
      if (first === null || first <= progressionIndex(progress.current)) {
        return progress
      }
      const previous = progressionOrder[first]
      return previous ? { ...progress, current: previous } : progress
    }
    case "Ability":
      return {
        ...progress,
        currentActive: Math.max(progress.currentActive, first ?? 0),
        currentPassive: Math.max(progress.currentPassive, second ?? 0),
      }
    default:
      return progress
  }
}
