import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

import { useCreateGoalLauncher } from "@/features/goal-planning"

/** The Goals toolbar's page action (filled, desktop only); preselects the scoped project. */
export function GoalsCreateButton({ scopeId }: { scopeId: string | null }) {
  const { t } = useTranslation()
  const launchCreateGoal = useCreateGoalLauncher()
  return (
    <Button
      data-testid="goals-create-goal"
      onClick={() =>
        scopeId
          ? launchCreateGoal({ projectIds: [scopeId] })
          : launchCreateGoal()
      }
    >
      <Plus data-icon="inline-start" />
      {t("goals.createButton")}
    </Button>
  )
}
