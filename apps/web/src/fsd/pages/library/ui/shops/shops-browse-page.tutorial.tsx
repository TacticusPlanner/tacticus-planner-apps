import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey = "day" | "shop" | "random"

/**
 * Joyride tour for the public Library Shops browsing page: the day selector, the shop selector, and
 * how a randomized "N possible rewards" slot is read. The day/shop controls have different
 * `data-testid`s per viewport (segmented toggles on desktop, dropdowns on mobile), so the two step
 * sets target different elements.
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
        step("shops-day-toggle", "day"),
        step("shops-shop-toggle", "shop"),
        step("shop-slot-0", "random"),
      ] satisfies Step[],
      mobile: [
        step("shops-day-select", "day"),
        step("shops-shop-select", "shop"),
        step("shop-slot-0", "random"),
      ] satisfies Step[],
    }
  }, [t])

  useTourPageSteps(steps)
}
