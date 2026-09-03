import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey = "purpose" | "availability" | "card"

/**
 * Joyride tour for the Dailies Shops recommendations page: the page's purpose, the
 * guaranteed-vs-possible distinction, and how a card's cost / needed-by detail is read. Desktop and
 * mobile share the same targets (both subviews carry the same `data-testid`s).
 */
export function useShopsTutorial() {
  const { t } = useTranslation("shops")

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.shops.steps.${key}.title`),
      content: t(`tour.shops.steps.${key}.content`),
    })

    const shared: Step[] = [
      step("shops-page", "purpose"),
      step("shop-group-guaranteed", "availability"),
      step("shop-group-possible", "card"),
    ]

    return { desktop: shared, mobile: shared }
  }, [t])

  useTourPageSteps(steps)
}
