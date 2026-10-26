import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { useUnitName } from "@/shared/unit-name"

import type { GoalEditSaveError } from "../../model/goal-edit/use-goal-edit-save"
import { projectConflictText } from "@/features/goal-planning/@x/goal-create"

/** Names why the last Save failed. Every case means nothing was saved and the draft is kept; a stale
 * goal or stale order offers the refresh that lets the owner review and retry, and a target colliding
 * with a sibling goal (any type with a target, goal-target-milestones) offers to open that goal. */
export function GoalEditError({
  error,
  onRefreshGoal,
  onReloadOrder,
  onOpenGoal,
}: {
  error: GoalEditSaveError
  onRefreshGoal: () => void
  onReloadOrder: () => void
  onOpenGoal?: (goalId: string) => void
}) {
  const { t } = useTranslation()
  const getUnitName = useUnitName()

  return (
    <div
      className="grid justify-items-start gap-2 text-sm"
      data-testid="goal-edit-error"
      role="alert"
    >
      <p className="text-destructive">
        {error.kind === "stale"
          ? t("goals.edit.errors.stale")
          : error.kind === "order"
            ? t("goals.edit.errors.order")
            : error.kind === "conflict"
              ? projectConflictText(
                  t,
                  error.goal,
                  getUnitName(error.goal.entityType, error.goal.entityId)
                )
              : error.kind === "invalid"
                ? t("goals.edit.errors.invalid", {
                    sections:
                      error.sections
                        .map((section) => t(`goals.edit.sections.${section}`))
                        .join(", ") || t("goals.edit.sections.unknown"),
                    message: error.message ?? "",
                  })
                : t("goals.edit.errors.failed")}
      </p>
      {error.kind === "stale" ? (
        <Button
          data-testid="goal-edit-refresh"
          onClick={onRefreshGoal}
          size="xs"
          variant="outline"
        >
          {t("goals.edit.refresh")}
        </Button>
      ) : null}
      {error.kind === "conflict" && onOpenGoal ? (
        <Button
          data-testid="goal-edit-open-conflict"
          onClick={() => onOpenGoal(error.goal.goalId)}
          size="xs"
          variant="outline"
        >
          {t("goals.edit.openConflict")}
        </Button>
      ) : null}
      {error.kind === "order" ? (
        <Button
          data-testid="goal-edit-reload-order"
          onClick={onReloadOrder}
          size="xs"
          variant="outline"
        >
          {t("goals.edit.reloadOrder")}
        </Button>
      ) : null}
    </div>
  )
}
