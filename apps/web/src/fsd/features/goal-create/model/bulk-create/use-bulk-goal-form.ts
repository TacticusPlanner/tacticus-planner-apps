import { useMemo, useState } from "react"
import {
  progressionIndex,
  rankIndex,
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
import { bulkTargetOptions, snapUp } from "./bulk-target-options"

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
  // The create sheet's project rule: the user's own choice, else the Default project.
  const [chosenProjectIds, setProjectIds] = useState<readonly string[]>([])
  const projectIds: readonly string[] =
    chosenProjectIds.length > 0
      ? chosenProjectIds
      : defaultProjectId
        ? [defaultProjectId]
        : []

  const hasUnowned = units.some((unit) => !unit.owned)
  const hasCharacter = units.some((unit) => unit.kind === "character")
  // Each picker starts above the lowest current value of the listed units; a chosen (or default)
  // value below that snaps up to the first option, and a type with no option left can't be on.
  const { rankOptions, progressionOptions, abilityMin } = useMemo(
    () => bulkTargetOptions(units),
    [units]
  )
  const ascensionValue = snapUp(
    ascension.value,
    progressionOptions,
    progressionIndex
  )
  const rankValue = snapUp(rank.value, rankOptions, rankIndex)
  const abilityValue =
    abilityMin === null ? null : Math.max(ability.value, abilityMin)
  const targetUnlock = hasUnowned && unlock
  const targetAscension = ascension.on ? ascensionValue : null
  const targetRank = hasCharacter && rank.on ? rankValue : null
  const targetAbility = ability.on ? abilityValue : null
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
    projectIds,
    setProjectIds,
    hasUnowned,
    hasCharacter,
    unlock,
    setUnlock,
    ascension: {
      on: ascension.on && ascensionValue !== null,
      value: ascensionValue ?? ascension.value,
    },
    ascensionAvailable: ascensionValue !== null,
    setAscension,
    rank: { on: rank.on && rankValue !== null, value: rankValue ?? rank.value },
    rankAvailable: rankValue !== null,
    setRank,
    ability: {
      on: ability.on && abilityValue !== null,
      value: abilityValue ?? ability.value,
    },
    abilityAvailable: abilityValue !== null,
    abilityMin: abilityMin ?? 1,
    setAbility,
    progressionOptions,
    rankOptions,
    plans,
    overLimit,
    goalCount,
    unitCount,
    canCreate: !goalsLoading && goalCount > 0 && overLimit.length === 0,
  }
}
