import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

export function useRaidsPlanTutorial() {
  const { t } = useTranslation("dailies")
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key: "navigation" | "project" | "summary" | "days"
    ): Step => ({
      target,
      title: t(`tour.raidsPlan.steps.${key}.title`),
      content: t(`tour.raidsPlan.steps.${key}.content`),
    })
    const shared = [
      createStep('[data-testid="raids-tabs"]', "navigation"),
      createStep('[data-testid="dailies-project-select"]', "project"),
      createStep('[data-testid="plan-summary"]', "summary"),
      createStep('[data-testid="plan-days"]', "days"),
    ]
    return { desktop: shared, mobile: shared }
  }, [t])
  useTourPageSteps(steps)
}
