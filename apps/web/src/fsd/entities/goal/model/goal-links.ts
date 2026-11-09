import { rankOrder } from "@workspace/game-domain"

import { holdsGlobalPosition } from "./goal-order"
import type { GoalDetail } from "./types"

type Range = { start: number; end: number }

/** A goal's links. A goal cached before the API served the field has none. */
export const linkedGoalIdsOf = (goal: GoalDetail): readonly string[] =>
  (goal as Partial<Pick<GoalDetail, "linkedGoalIds">>).linkedGoalIds ?? []

/** The smallest range covering every given one; null when none is non-empty. */
function span(ranges: readonly Range[]): Range | null {
  const valid = ranges.filter((range) => range.start < range.end)
  if (valid.length === 0) return null
  return {
    start: Math.min(...valid.map((range) => range.start)),
    end: Math.max(...valid.map((range) => range.end)),
  }
}

/** The in-flight goals an Upgrade goal links to (its unit's Rank or Ability goals), in link order.
 *  Completed, archived or deleted links are dropped. */
export function linkedGoalsOf(
  goal: GoalDetail,
  goalsById: ReadonlyMap<string, GoalDetail>
): GoalDetail[] {
  if (goal.goalType !== "Upgrade") return []
  return linkedGoalIdsOf(goal).flatMap((id) => {
    const linked = goalsById.get(id)
    return linked &&
      holdsGlobalPosition(linked) &&
      linked.entityId === goal.entityId &&
      (linked.goalType === "Rank" || linked.goalType === "Ability")
      ? [linked]
      : []
  })
}

/**
 * The goal as the planner reads it: an Upgrade goal with in-flight links gets the span of its linked
 * goals as its ranges (a Rank goal's rank span, one rank further when it ends partway through a rank;
 * an Ability goal's level spans per track), so its pieces count toward exactly those goals' slots. An
 * Upgrade goal whose links are all gone, or that has none, keeps its own ranges (the implicit link).
 * Every other goal is returned as is.
 */
function withLinkedRanges(
  goal: GoalDetail,
  goalsById: ReadonlyMap<string, GoalDetail>
): GoalDetail {
  const upgrade = goal.config.upgrade
  const linked = linkedGoalsOf(goal, goalsById)
  if (!upgrade || linked.length === 0) return goal
  const lastIndex = rankOrder.length - 1
  const rankRange = span(
    linked.flatMap(({ config: { rank } }) =>
      rank
        ? [
            {
              start: rank.start,
              end: Math.min(
                rank.endPointFive || rank.endAppliedUpgrades > 0
                  ? rank.end + 1
                  : rank.end,
                lastIndex
              ),
            },
          ]
        : []
    )
  )
  const abilities = linked.flatMap(({ config: { ability } }) =>
    ability ? [ability] : []
  )
  return {
    ...goal,
    config: {
      ...goal.config,
      upgrade: {
        ...upgrade,
        rankRange,
        activeRange: span(
          abilities.map((ability) => ({
            start: ability.activeStart,
            end: ability.activeEnd,
          }))
        ),
        passiveRange: span(
          abilities.map((ability) => ({
            start: ability.passiveStart,
            end: ability.passiveEnd,
          }))
        ),
      },
    },
  }
}

/** {@link withLinkedRanges} over a goal list, looking links up among the same goals. */
export function resolveGoalLinks(goals: readonly GoalDetail[]): GoalDetail[] {
  if (!goals.some((goal) => linkedGoalIdsOf(goal).length > 0)) return [...goals]
  const byId = new Map(goals.map((goal) => [goal.goalId, goal]))
  return goals.map((goal) => withLinkedRanges(goal, byId))
}

/** The goals an Upgrade goal on this unit can link to: its in-flight Rank goals (a Character) or Ability
 *  goals (a Machine of War), in the order given. */
export function linkCandidates(
  goals: readonly GoalDetail[],
  unit: { entityType: string; entityId: string }
): GoalDetail[] {
  const linkable = unit.entityType === "Mow" ? "Ability" : "Rank"
  return goals.filter(
    (goal) =>
      holdsGlobalPosition(goal) &&
      goal.entityType === unit.entityType &&
      goal.entityId === unit.entityId &&
      goal.goalType === linkable
  )
}
