import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

export function useHomePageTutorial() {
  const { t } = useTranslation("events")
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key: "title" | "navigation" | "calendar"
    ): Step => ({
      target,
      title: t(`tour.home.steps.${key}.title`),
      content: t(`tour.home.steps.${key}.content`),
    })
    const shared: Step[] = [
      createStep('[data-testid="home-page-title"]', "title"),
      createStep('[data-testid="events-calendar-navigation"]', "navigation"),
      createStep('[data-testid="events-calendar"]', "calendar"),
    ]
    return { desktop: shared, mobile: shared }
  }, [t])
  useTourPageSteps(steps)
}
