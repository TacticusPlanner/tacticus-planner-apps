import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { useCreateGoalLauncher } from "../../model/goal-creation-form/create-goal-launcher-context"

/** The Goals control area's Create goal button; icon-only on mobile, preselecting the scoped project. */
export function GoalsCreateButton({ scopeId }: { scopeId: string | null }) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const launchCreateGoal = useCreateGoalLauncher()
  return (
    <Button
      aria-label={t("goals.createButton")}
      data-testid="goals-create-goal"
      onClick={() =>
        scopeId
          ? launchCreateGoal({ projectIds: [scopeId] })
          : launchCreateGoal()
      }
      size="sm"
      variant="outline"
    >
      <Plus data-icon="inline-start" />
      {isMobile ? null : t("goals.createButton")}
    </Button>
  )
}
