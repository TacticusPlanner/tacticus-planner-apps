import { useTranslation } from "react-i18next"

import { progressionLabel, type GoalKind } from "@/entities/goal"
import { goalKindsForEntity } from "@/features/goal-planning/@x/goal-create"

import { buildCombinedGoalSpecs } from "../../model/goal-creation-form/goal-spec-builder"
import type { useCreateGoalForm } from "../../model/goal-creation-form/use-create-goal-form"
import { GoalRangeSummary } from "../shared/goal-range-summary"

type GoalForm = ReturnType<typeof useCreateGoalForm>

/** A goal type card's own cost line, from the preview its card already computes; null when it has none. */
function useCostLine(form: GoalForm) {
  const { t } = useTranslation()
  return (kind: GoalKind): string | null => {
    switch (kind) {
      case "Ascension":
        return form.progressionPreview
          ? t("goals.create.review.days", {
              days: form.progressionPreview.combinedDays.toFixed(1),
            })
          : null
      case "Rank":
      case "Ability": {
        // The upgrade preview covers a Character's Rank goal and a Machine of War's Ability goal.
        const costed = form.entityType === "Mow" ? "Ability" : "Rank"
        if (kind !== costed || form.missingUpgrades.length === 0) return null
        return t("goals.create.review.upgradesToFarm", {
          count: form.missingUpgrades.length,
        })
      }
      case "Upgrade":
        return form.upgradeGoalNeed.length > 0
          ? t("goals.create.review.upgradesToFarm", {
              count: form.upgradeGoalNeed.length,
            })
          : null
      default:
        return null
    }
  }
}

/**
 * "What will be created": each goal the submission creates, in goal-type card order, with its start →
 * target, prerequisites marked, and its card's cost line, then each project's estimate. While the form has
 * a blocking problem the estimate says it appears once the problems are fixed (goal-creation).
 */
export function GoalCreationReview({ form }: { form: GoalForm }) {
  const { t } = useTranslation()
  const costLine = useCostLine(form)
  const kinds = goalKindsForEntity(form.entityType)
  const specs = buildCombinedGoalSpecs(form.combinedSpecParams)
    .map((spec, index) => ({ spec, index }))
    .sort(
      (a, b) =>
        kinds.indexOf(a.spec.goalType) - kinds.indexOf(b.spec.goalType) ||
        a.index - b.index
    )
  const firstOfKind = new Set<number>()
  const seen = new Set<GoalKind>()
  for (const { spec, index } of specs) {
    if (!seen.has(spec.goalType)) firstOfKind.add(index)
    seen.add(spec.goalType)
  }
  if (specs.length === 0) return null
  const hasIssues = form.issues.length > 0

  return (
    <div
      className="grid gap-2 rounded-2xl border px-3 py-2 text-sm"
      data-testid="create-goal-review"
    >
      <p className="font-medium">{t("goals.create.reviewTitle")}</p>
      <ul className="grid gap-1">
        {specs.map(({ spec, index }) => {
          const prerequisite = !form.enabledTypes.has(spec.goalType)
          const cost = firstOfKind.has(index) ? costLine(spec.goalType) : null
          return (
            <li
              className="grid gap-0.5"
              data-testid="create-goal-review-item"
              key={index}
            >
              <span className="flex flex-wrap items-center gap-x-1.5">
                <span className="font-medium">
                  {t(`goals.create.goalTypes.${spec.goalType}`)}
                  {spec.goalType !== "Unlock" ? ":" : null}
                </span>
                <GoalRangeSummary entityType={form.entityType} spec={spec} />
                {prerequisite ? (
                  <span className="text-xs text-muted-foreground">
                    ({t("goals.create.review.prerequisite")})
                  </span>
                ) : null}
              </span>
              {cost ? (
                <span className="text-xs text-muted-foreground">{cost}</span>
              ) : null}
            </li>
          )
        })}
        {form.prerequisites.coveringAscension ? (
          <li
            className="text-muted-foreground"
            data-testid="create-goal-review-depends-on-existing"
          >
            {t("goals.create.suggestions.dependsOnExisting", {
              target: progressionLabel(
                t,
                form.prerequisites.coveringAscension.end
              ),
            })}
          </li>
        ) : null}
      </ul>
      {form.estimatedProjectIds.length > 0 ? (
        <ul className="grid gap-0.5 border-t pt-2 text-muted-foreground">
          {form.estimatedProjectIds.map((projectId) => {
            const project = form.projects.find(
              (candidate) => candidate.projectId === projectId
            )
            const estimate = form.perProjectEstimates.get(projectId)
            return (
              <li
                data-testid={`create-goal-project-estimate-${projectId}`}
                key={projectId}
              >
                {project?.name ?? projectId}
                {": "}
                {hasIssues
                  ? t("goals.create.review.estimateAfterFix")
                  : !estimate || estimate.status === "loading"
                    ? t("goals.create.projectEstimateLoading")
                    : estimate.status === "unavailable"
                      ? t("goals.create.projectEstimateUnavailable")
                      : estimate.outcome.status === "Blocked"
                        ? t(`goals.estimate.blocked.${estimate.outcome.reason}`)
                        : t("goals.create.review.projectDone", {
                            days: estimate.outcome.days,
                          })}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
