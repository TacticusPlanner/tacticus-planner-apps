import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey = "day" | "shop" | "random"

/**
 * Joyride tour for the public Library Shops browsing page: the day select, the shop tabs, and how a
 * randomized "N possible rewards" slot is read. The controls are the same on both; the mobile list
 * stays separate so the tour helper keeps its desktop/mobile shape.
 */
export function useShopsBrowseTutorial() {
  const { t } = useTranslation("library")

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`shops.tour.libraryShops.steps.${key}.title`),
      content: t(`shops.tour.libraryShops.steps.${key}.content`),
    })

    return {
      desktop: [
        step("shops-day-select", "day"),
        step("shops-shop-toggle", "shop"),
        step("shop-slot-0", "random"),
      ] satisfies Step[],
      mobile: [
        step("shops-day-select", "day"),
        step("shops-shop-toggle", "shop"),
        step("shop-slot-0", "random"),
      ] satisfies Step[],
    }
  }, [t])

  useTourPageSteps(steps)
}
