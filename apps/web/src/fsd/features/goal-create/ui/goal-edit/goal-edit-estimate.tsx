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
import { ProgressionPreview } from "../create-goal/goal-farming-fields"
import { ResourcesNeededList } from "../create-goal/goal-type-fields"
import { PreviewSection } from "../shared/preview-section"

/**
 * The resources and estimated days from the goal's start to the draft target, computed as the create
 * preview computes them (goal-edit-dialog): Ascension through the same progression preview over the
 * draft's acquisition sources, Rank, Upgrade and Machine-of-War Ability through `estimateGoal` over the
 * materials the draft needs. A Character Ability goal says its cost isn't supported, as creation does.
 * Unlock has no target, so the dialog renders none.
 */
export function GoalEditEstimate({
  detail,
  target,
  catalog,
  acquisition,
  dailyEnergy,
}: {
  detail: GoalDetail
  target: GoalTargetDraft
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
      target.kind === "Ascension"
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
      goalEditMaterialNeeds(detail, target, catalog)
        .filter((entry) => entry.missing > 0)
        .map((entry) => ({
          ...entry,
          label: catalog.upgradesById.get(entry.id as never)?.label ?? entry.id,
        })),
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

  const title = t("goals.edit.estimate.title")
  if (isAscension) {
    return (
      <section className="grid gap-1.5" data-testid="goal-edit-estimate">
        <h3 className="font-semibold">{title}</h3>
        {progressionPreview ? (
          <ProgressionPreview preview={progressionPreview} />
        ) : (
          <p className="text-muted-foreground">
            {t("goals.edit.estimate.loading")}
          </p>
        )}
      </section>
    )
  }
  if (detail.goalType === "Ability" && detail.entityType === "Character") {
    return (
      <section className="grid gap-1.5" data-testid="goal-edit-estimate">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">
          {t("goals.create.characterAbilityCostUnsupported")}
        </p>
      </section>
    )
  }

  return (
    <PreviewSection
      emptyText={t("goals.edit.estimate.nothing")}
      state={
        catalog.upgradesById.size === 0
          ? "loading"
          : needs.length === 0
            ? "empty"
            : "content"
      }
      testId="goal-edit-estimate"
      title={title}
    >
      <ResourcesNeededList missingUpgrades={needs} />
      {estimate ? (
        <p className="font-medium" data-testid="goal-edit-estimate-days">
          {estimate.status === "Blocked"
            ? t(`goals.estimate.blocked.${estimate.reason}`)
            : t("goals.edit.estimate.days", { days: estimate.days })}
        </p>
      ) : null}
    </PreviewSection>
  )
}
