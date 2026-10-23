import { useMemo } from "react"

import {
  startingProgression,
  type Progression,
  type Rank,
  type UnitId,
} from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"

import { buildReviewItems } from "./goal-spec-builder"
import type { GoalAcquisitionPlan } from "./acquisition-plan"
import { useGoalPrerequisites } from "./use-goal-prerequisites"
import { useProgressionPreview } from "./use-progression-preview"

type ProgressionPreviewParams = Parameters<typeof useProgressionPreview>[0]

/**
 * Combined-creation prerequisite detection (plan §6) — a locked entity (Character or MoW) needs
 * Unlock first; a Rank or Ability target beyond what the entity's current Ascension allows needs
 * Ascension first (an Ability target can trigger this for a MoW too, even though Rank never does)
 * — plus the "what will actually be submitted" flags those prerequisites feed into
 * (`includesUnlock`/`includesAscension`), the Ascension day-by-day preview, and the "what will be
 * created" review list (plan §7), all of which derive from the same prerequisite state. Kept as
 * its own hook so `use-create-goal-form.ts` stays under the 800-line ceiling.
 */
export function useGoalPrerequisitesAndReview({
  entityId,
  entityType,
  isOwned,
  playerEntity,
  character,
  enabledTypes,
  rankEnd,
  abilityActiveEnd,
  abilityPassiveEnd,
  includeSuggestedUnlock,
  includeSuggestedAscension,
  progressionStart,
  progressionEnd,
  plan,
  ascensionCostsById,
  unlockShardCostsById,
  battlesById,
  dailyEnergy,
}: {
  entityId: UnitId | undefined
  entityType: "Character" | "Mow"
  isOwned: boolean
  playerEntity: ProgressionPreviewParams["playerEntity"]
  character: ProgressionPreviewParams["character"]
  enabledTypes: ReadonlySet<GoalKind>
  rankEnd: Rank
  abilityActiveEnd: number
  abilityPassiveEnd: number
  includeSuggestedUnlock: boolean
  includeSuggestedAscension: boolean
  progressionStart: Progression
  progressionEnd: Progression
  plan: GoalAcquisitionPlan
  ascensionCostsById: ProgressionPreviewParams["ascensionCostsById"]
  unlockShardCostsById: ProgressionPreviewParams["unlockShardCostsById"]
  battlesById: ProgressionPreviewParams["battlesById"]
  dailyEnergy: number
}) {
  const prerequisites = useGoalPrerequisites({
    isLocked: !!entityId && !isOwned,
    currentProgression: playerEntity?.progressionIndex,
    unlockProgression: character
      ? startingProgression(character.initialRarity)
      : undefined,
    enabledTypes,
    rankEnd,
    abilityActiveEnd,
    abilityPassiveEnd,
  })

  // Whether Unlock will actually be submitted — either the user toggled it explicitly, or it's
  // required as a prerequisite for another enabled type on a locked entity.
  const includesUnlock =
    enabledTypes.has("Unlock") ||
    (prerequisites.needsUnlock && includeSuggestedUnlock)
  // Whether Ascension will actually be submitted — either explicit, or the auto-suggested one.
  const includesAscension =
    enabledTypes.has("Ascension") ||
    (!!prerequisites.needsAscension && includeSuggestedAscension)

  const progressionPreview = useProgressionPreview({
    entityId,
    entityType,
    character,
    playerEntity,
    progressionStart,
    progressionEnd,
    ascensionEnabled: includesAscension,
    unlockEnabled: includesUnlock,
    plan,
    ascensionCostsById,
    unlockShardCostsById,
    battlesById,
    dailyEnergy,
  })

  // "What will be created" review list (plan §7) — in submit order, flagging entries the user
  // didn't explicitly toggle themselves. Pure builder in ./goal-spec-builder.ts.
  const reviewItems = useMemo(
    () => buildReviewItems(enabledTypes, includesUnlock, includesAscension),
    [enabledTypes, includesUnlock, includesAscension]
  )

  return {
    prerequisites,
    includesUnlock,
    includesAscension,
    progressionPreview,
    reviewItems,
  }
}
