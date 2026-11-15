import { useState } from "react"

import type { Progression, Rank } from "@workspace/game-domain"

import {
  EMPTY_MILESTONES,
  nextAbilityMilestone,
  nextProgressionMilestone,
  nextRankMilestone,
  type AbilityMilestone,
  type GoalMilestones,
} from "./goal-milestones"

/**
 * The extra end targets of the Rank, Ascension and Ability ladders ("Add milestone",
 * goal-target-milestones). The cards' own target fields stay the first milestone; `add` appends one
 * step above the last target, which the caller passes in.
 */
export function useGoalMilestones() {
  const [milestones, setMilestones] = useState<GoalMilestones>(EMPTY_MILESTONES)

  const addRank = (last: Rank) =>
    setMilestones((current) => ({
      ...current,
      rank: [...current.rank, nextRankMilestone(last)],
    }))
  const addAscension = (last: Progression) =>
    setMilestones((current) => ({
      ...current,
      ascension: [...current.ascension, nextProgressionMilestone(last)],
    }))
  const addAbility = (last: AbilityMilestone) =>
    setMilestones((current) => ({
      ...current,
      ability: [...current.ability, nextAbilityMilestone(last)],
    }))

  const update = <K extends keyof GoalMilestones>(
    kind: K,
    index: number,
    value: GoalMilestones[K][number]
  ) =>
    setMilestones((current) => ({
      ...current,
      [kind]: current[kind].map((entry, position) =>
        position === index ? value : entry
      ),
    }))

  const remove = (kind: keyof GoalMilestones, index: number) =>
    setMilestones((current) => ({
      ...current,
      [kind]: current[kind].filter((_, position) => position !== index),
    }))

  const reset = () => setMilestones(EMPTY_MILESTONES)

  return {
    milestones,
    addRank,
    addAscension,
    addAbility,
    update,
    remove,
    reset,
  }
}
