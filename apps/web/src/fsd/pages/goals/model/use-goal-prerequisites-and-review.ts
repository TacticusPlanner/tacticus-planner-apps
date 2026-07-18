import { useMemo } from "react"

import type { Progression, Rank, UnitId } from "@workspace/game-domain"

import type { AscensionFarmingSource, GoalKind } from "@/entities/goal"

import { buildReviewItems } from "./goal-spec-builder"
import { useGoalPrerequisites } from "./use-goal-prerequisites"
import { useProgressionPreview } from "./use-progression-preview"

type ProgressionPreviewParams = Parameters<typeof useProgressionPreview>[0]

/**
 * Combined-creation prerequisite detection (plan §6) — a locked entity (Character or MoW) needs
 * Unlock first; a Rank target beyond what a Character's current Ascension allows needs Ascension
 * first (never triggers for a MoW, since Rank is never in `enabledTypes` there) — plus the
 * "what will actually be submitted" flags those prerequisites feed into (`includesUnlock`/
 * `includesAscension`), the Ascension day-by-day preview, and the "what will be created" review
 * list (plan §7), all of which derive from the same prerequisite state. Split out of
 * `use-create-goal-form.ts` purely for that file's own max-lines budget.
 */
export function useGoalPrerequisitesAndReview({
  entityId,
  entityType,
  isOwned,
  playerEntity,
  character,
  enabledTypes,
  rankEnd,
  includeSuggestedUnlock,
  includeSuggestedAscension,
  progressionStart,
  progressionEnd,
  ascensionFarmingSource,
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
  includeSuggestedUnlock: boolean
  includeSuggestedAscension: boolean
  progressionStart: Progression
  progressionEnd: Progression
  ascensionFarmingSource: AscensionFarmingSource
  ascensionCostsById: ProgressionPreviewParams["ascensionCostsById"]
  unlockShardCostsById: ProgressionPreviewParams["unlockShardCostsById"]
  battlesById: ProgressionPreviewParams["battlesById"]
  dailyEnergy: number
}) {
  const prerequisites = useGoalPrerequisites({
    isLocked: !!entityId && !isOwned,
    currentProgression: playerEntity?.progressionIndex,
    enabledTypes,
    rankEnd,
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
    source: ascensionFarmingSource,
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
