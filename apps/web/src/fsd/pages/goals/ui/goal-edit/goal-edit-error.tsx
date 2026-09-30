import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import type { GoalEditSaveError } from "../../model/goal-edit/use-goal-edit-save"

/** Names why the last Save failed. Every case means nothing was saved and the draft is kept; a stale
 * goal or stale order offers the refresh that lets the owner review and retry. */
export function GoalEditError({
  error,
  onRefreshGoal,
  onReloadOrder,
}: {
  error: GoalEditSaveError
  onRefreshGoal: () => void
  onReloadOrder: () => void
}) {
  const { t } = useTranslation()

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
              ? t("goals.edit.errors.conflict", {
                  project: error.projectNames.join(", "),
                })
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
