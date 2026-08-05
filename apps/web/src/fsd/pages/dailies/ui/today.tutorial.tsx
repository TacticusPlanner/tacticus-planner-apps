import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

export function useTodayTutorial() {
  const { t } = useTranslation("dailies")
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key:
        | "navigation"
        | "raids"
        | "project"
        | "schedule"
        | "energyUsage"
        | "todaysAttempts"
    ): Step => ({
      target,
      title: t(`tour.today.steps.${key}.title`),
      content: t(`tour.today.steps.${key}.content`),
    })
    const shared = [
      createStep('[data-testid="dailies-primary-tabs"]', "navigation"),
      createStep('[data-testid="raids-tabs"]', "raids"),
      createStep('[data-testid="dailies-project-select"]', "project"),
      createStep('[data-testid="energy-usage"]', "energyUsage"),
      createStep('[data-testid="today-schedule"]', "schedule"),
      createStep('[data-testid="todays-attempts"]', "todaysAttempts"),
    ]
    return { desktop: shared, mobile: shared }
  }, [t])
  useTourPageSteps(steps)
}
