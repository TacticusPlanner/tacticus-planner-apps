import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

export function useTodayTutorial() {
  const { t } = useTranslation(["dailies", "shops"])
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key:
        | "navigation"
        | "filters"
        | "schedule"
        | "campaignEvent"
        | "energyUsage"
        | "todaysAttempts"
    ): Step => ({
      target,
      title: t(`tour.today.steps.${key}.title`),
      content: t(`tour.today.steps.${key}.content`),
    })
    const createShopsStep = (
      target: string,
      key: "purpose" | "availability" | "card"
    ): Step => ({
      target,
      title: t(`shops:tour.shops.steps.${key}.title`),
      content: t(`shops:tour.shops.steps.${key}.content`),
    })
    const shared = [
      createStep('[data-testid="dailies-primary-tabs"]', "navigation"),
      createStep('[data-testid="raids-filters"]', "filters"),
      createStep('[data-testid="campaign-event-status"]', "campaignEvent"),
      createStep('[data-testid="energy-usage"]', "energyUsage"),
      createStep('[data-testid="today-lanes"]', "schedule"),
      createStep('[data-testid="todays-attempts"]', "todaysAttempts"),
      // The shop steps keep the former Shops tab's copy, from the shops namespace.
      createShopsStep('[data-testid="today-shops"]', "purpose"),
      createShopsStep('[data-testid="shop-group-guaranteed"]', "availability"),
      createShopsStep('[data-testid="shop-group-possible"]', "card"),
    ]
    return { desktop: shared, mobile: shared }
  }, [t])
  useTourPageSteps(steps)
}
