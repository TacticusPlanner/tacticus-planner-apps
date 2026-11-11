import { useMemo, useState } from "react"
import {
  progressionOrder,
  rankOrder,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import { useGoalsById } from "@/entities/goal"
import { useProjects } from "@/entities/project"

import {
  buildBulkGoalPlans,
  bulkPlanTypesOverLimit,
  type BulkGoalTargets,
  type BulkGoalUnit,
} from "./bulk-goal-plan"

/** One shared target type the dialog turns on with its value. */
type Toggled<T> = { on: boolean; value: T }

const DEFAULT_ASCENSION: Progression = "Legendary:RedFiveStars"
const DEFAULT_RANK: Rank = "Diamond3"
const DEFAULT_ABILITY = 50

/**
 * The bulk dialog's form: the shared target (Unlock, Ascension, Rank, Abilities), the project, and
 * each selected unit's plan against the user's in-flight goals, plus the goal types the plans would
 * push over the cap.
 */
export function useBulkGoalForm(units: readonly BulkGoalUnit[]) {
  const { goalsById, loading: goalsLoading } = useGoalsById()
  const { projects, defaultProjectId } = useProjects()
  const [unlock, setUnlock] = useState(true)
  const [ascension, setAscension] = useState<Toggled<Progression>>({
    on: false,
    value: DEFAULT_ASCENSION,
  })
  const [rank, setRank] = useState<Toggled<Rank>>({
    on: true,
    value: DEFAULT_RANK,
  })
  const [ability, setAbility] = useState<Toggled<number>>({
    on: false,
    value: DEFAULT_ABILITY,
  })
  const [chosenProjectId, setProjectId] = useState<string | undefined>()
  const projectId = chosenProjectId ?? defaultProjectId

  const hasUnowned = units.some((unit) => !unit.owned)
  const hasCharacter = units.some((unit) => unit.kind === "character")
  const targetUnlock = hasUnowned && unlock
  const targetAscension = ascension.on ? ascension.value : null
  const targetRank = hasCharacter && rank.on ? rank.value : null
  const targetAbility = ability.on ? ability.value : null
  const plans = useMemo(() => {
    const targets: BulkGoalTargets = {
      unlock: targetUnlock,
      ascension: targetAscension,
      rank: targetRank,
      ability: targetAbility,
    }
    return buildBulkGoalPlans(units, targets, goalsById.values())
  }, [
    units,
    targetUnlock,
    targetAscension,
    targetRank,
    targetAbility,
    goalsById,
  ])
  const overLimit = useMemo(
    () => bulkPlanTypesOverLimit(plans, goalsById.values()),
    [plans, goalsById]
  )
  const goalCount = plans.reduce((sum, plan) => sum + plan.specs.length, 0)
  const unitCount = plans.filter((plan) => plan.specs.length > 0).length

  return {
    goalsLoading,
    projects,
    projectId,
    setProjectId,
    hasUnowned,
    hasCharacter,
    unlock,
    setUnlock,
    ascension,
    setAscension,
    rank,
    setRank,
    ability,
    setAbility,
    progressionOptions: progressionOrder,
    rankOptions: [...rankOrder],
    plans,
    overLimit,
    goalCount,
    unitCount,
    canCreate: !goalsLoading && goalCount > 0 && overLimit.length === 0,
  }
}
