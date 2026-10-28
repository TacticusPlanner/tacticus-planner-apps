import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

// Dailies' child pages sit in the shell's section menu on desktop (expanded, or collapsed to its
// reopen toggle) and in the header's section tabs on mobile.
const DESKTOP_SECTION_NAVIGATION =
  '[data-testid="desktop-section-navigation"], [data-testid="desktop-section-toggle"]'
const MOBILE_SECTION_NAVIGATION = '[data-testid="section-tabs"]'

export function useTodayTutorial() {
  const { t } = useTranslation(["dailies", "shops"])
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key:
        | "navigation"
        | "filters"
        | "quickFilters"
        | "schedule"
        | "campaignEvent"
        | "energyUsage"
        | "todaysAttempts"
        | "onslaught",
      { optional = false } = {}
    ): Step => ({
      target,
      title: t(`tour.today.steps.${key}.title`),
      content: t(`tour.today.steps.${key}.content`),
      ...(optional ? { data: { optional: true } } : {}),
    })
    const createShopsStep = (
      target: string,
      key: "purpose" | "availability" | "card",
      { optional = false } = {}
    ): Step => ({
      target,
      title: t(`shops:tour.shops.steps.${key}.title`),
      content: t(`shops:tour.shops.steps.${key}.content`),
      ...(optional ? { data: { optional: true } } : {}),
    })
    const pageSteps = [
      createStep('[data-testid="raids-filters"]', "filters"),
      createStep('[data-testid="today-quick-filters"]', "quickFilters"),
      createStep('[data-testid="campaign-event-status"]', "campaignEvent"),
      createStep('[data-testid="energy-usage"]', "energyUsage"),
      createStep('[data-testid="today-plan-area"]', "schedule"),
      createStep('[data-testid="todays-attempts"]', "todaysAttempts"),
      // The Onslaught card is left out when no goal needs a run; the tour drops its step then.
      createStep('[data-testid="today-onslaught"]', "onslaught", {
        optional: true,
      }),
      // The shop steps keep the former Shops tab's copy, from the shops namespace.
      createShopsStep('[data-testid="today-shops"]', "purpose"),
      // The offer groups only render when something is worth buying.
      createShopsStep('[data-testid="shop-group-guaranteed"]', "availability", {
        optional: true,
      }),
      createShopsStep('[data-testid="shop-group-possible"]', "card", {
        optional: true,
      }),
    ]
    return {
      desktop: [
        // Beside the menu: the expanded panel runs the full page height, so above or below it
        // would place the tooltip off screen.
        {
          ...createStep(DESKTOP_SECTION_NAVIGATION, "navigation"),
          placement: "right" as const,
        },
        ...pageSteps,
      ],
      mobile: [
        createStep(MOBILE_SECTION_NAVIGATION, "navigation"),
        ...pageSteps,
      ],
    }
  }, [t])
  useTourPageSteps(steps)
}
