import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

/** Home's own tour, walking its four dashboard widgets. Reached via the "Tour this page" control
 *  (PageTourButton); the app-wide navigation tour stays behind the persistent "Show me around"
 *  control and is unaffected by this registration - see tour-provider.tsx's two tour kinds. */
export function useHomePageTutorial() {
  const { t } = useTranslation("events")
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key:
        "tokenAvailability" | "projects" | "raids" | "navigation" | "calendar"
    ): Step => ({
      target,
      title: t(`tour.home.steps.${key}.title`),
      content: t(`tour.home.steps.${key}.content`),
    })
    const shared: Step[] = [
      createStep('[data-testid="token-availability"]', "tokenAvailability"),
      createStep('[data-testid="home-projects-widget"]', "projects"),
      createStep('[data-testid="home-raids-widget"]', "raids"),
      createStep('[data-testid="events-calendar-navigation"]', "navigation"),
      createStep('[data-testid="events-calendar"]', "calendar"),
    ]
    return { desktop: shared, mobile: shared }
  }, [t])
  useTourPageSteps(steps)
}
