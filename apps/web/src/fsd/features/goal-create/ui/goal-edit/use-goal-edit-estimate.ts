import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { isProgression, type UpgradeId } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import { estimateGoal } from "@/features/goal-farming/@x/goal-create"
import type { useGoalCatalog } from "@/features/goal-planning/@x/goal-create"

import { goalEditMaterialNeeds } from "../../model/goal-edit/goal-edit-material-needs"
import type { useGoalEditAcquisition } from "../../model/goal-edit/use-goal-edit-acquisition"
import { useProgressionPreview } from "../../model/goal-creation-form/use-progression-preview"
import type { GoalTargetDraft } from "../../model/target-edit/goal-target-edit"
import type { ResourcePreview } from "../goal-card/card-parts"

/**
 * The previews of the goal's card, from its start to the draft target, computed as the create preview
 * computes them (goal-edit-dialog): Ascension through the same progression preview over the draft's
 * acquisition sources, Rank, Upgrade and Machine-of-War Ability through `estimateGoal` over the
 * materials the draft needs. A Character Ability goal gets no resource preview (its cost isn't
 * supported, as at creation).
 */
export function useGoalEditEstimate({
  detail,
  target,
  catalog,
  acquisition,
  dailyEnergy,
}: {
  detail: GoalDetail
  target: GoalTargetDraft | null
  catalog: ReturnType<typeof useGoalCatalog>
  acquisition: ReturnType<typeof useGoalEditAcquisition>
  dailyEnergy: number
}) {
  const { t } = useTranslation()
  const isAscension = detail.goalType === "Ascension"
  const start = detail.config.progression?.start
  const progressionStart = start && isProgression(start) ? start : undefined
  const progressionPreview = useProgressionPreview({
    entityId: isAscension ? (detail.entityId as never) : undefined,
    entityType: detail.entityType,
    character:
      detail.entityType === "Character"
        ? catalog.charactersById?.get(detail.entityId)
        : undefined,
    progressionStart: progressionStart ?? "Common:None",
    progressionEnd:
      target?.kind === "Ascension"
        ? target.end
        : (progressionStart ?? "Common:None"),
    ascensionEnabled: isAscension && !!progressionStart,
    unlockEnabled: false,
    plan: acquisition.selection.plan,
    ascensionCostsById: catalog.ascensionCostsById,
    unlockShardCostsById: catalog.unlockShardCostsById,
    battlesById: catalog.battlesById,
    dailyEnergy,
  })

  const needs = useMemo(
    () =>
      target
        ? goalEditMaterialNeeds(detail, target, catalog)
            .filter((entry) => entry.missing > 0)
            .map((entry) => ({
              ...entry,
              label:
                catalog.upgradesById.get(entry.id as never)?.label ?? entry.id,
            }))
        : [],
    [detail, target, catalog]
  )
  const estimate = useMemo(
    () =>
      needs.length > 0
        ? estimateGoal({
            needs: needs.map((entry) => ({
              id: entry.id as UpgradeId,
              count: entry.missing,
            })),
            upgradesById: catalog.upgradesById,
            battlesById: catalog.battlesById,
            dailyEnergy,
          })
        : null,
    [needs, catalog.upgradesById, catalog.battlesById, dailyEnergy]
  )

  const resourcePreview: ResourcePreview | undefined =
    detail.goalType === "Ability" && detail.entityType === "Character"
      ? undefined
      : {
          state:
            catalog.upgradesById.size === 0
              ? "loading"
              : needs.length === 0
                ? "empty"
                : "content",
          missingUpgrades: needs,
          days: estimate
            ? estimate.status === "Blocked"
              ? t(`goals.estimate.blocked.${estimate.reason}`)
              : t("goals.edit.estimate.days", { days: estimate.days })
            : undefined,
        }

  return { progressionPreview, resourcePreview }
}
