import { useContext } from "react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { CreateGoalLauncherContext } from "../model/create-goal-launcher"
import type { CreateGoalPrefill } from "../model/create-goal-launcher"

/**
 * "Create goal" for an empty state that is empty for want of goals (Goals, Insights, Raids,
 * Schedule): opens the app's goal creation sheet. Renders nothing outside the app shell, where no
 * sheet exists to open.
 */
export function CreateGoalButton({
  prefill,
  testId,
}: {
  prefill?: CreateGoalPrefill
  testId?: string
}) {
  const { t } = useTranslation()
  const launch = useContext(CreateGoalLauncherContext)
  if (!launch) return null
  return (
    <Button data-testid={testId} onClick={() => launch(prefill)}>
      <Plus data-icon="inline-start" />
      {t("goals.createButton")}
    </Button>
  )
}
