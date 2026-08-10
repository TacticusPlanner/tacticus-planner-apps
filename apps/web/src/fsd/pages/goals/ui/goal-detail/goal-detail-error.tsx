import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

export type GoalDetailSaveError = {
  goalId: string
  message: string
  existingGoalId?: string
}

export function GoalDetailError({
  error,
  existingGoalId,
  onGoalChange,
}: {
  error: string
  existingGoalId?: string
  onGoalChange?: (goalId: string) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="grid justify-items-start gap-2 px-4" role="alert">
      <p className="text-sm text-destructive">{error}</p>
      {existingGoalId && onGoalChange ? (
        <Button
          onClick={() => onGoalChange(existingGoalId)}
          size="xs"
          variant="outline"
        >
          {t("goals.project.reviewConflictingGoal")}
        </Button>
      ) : null}
    </div>
  )
}
