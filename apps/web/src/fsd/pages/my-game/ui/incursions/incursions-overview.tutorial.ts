import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey = "rules" | "list"

/**
 * Joyride tour for the Incursions overview: the rules disclosure, then the MoW cards (each opens
 * that MoW's tiers). A MoW's and a tier's pages register no steps of their own. Desktop and mobile
 * share the targets.
 */
export function useIncursionsOverviewTutorial() {
  const { t } = useTranslation()

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.incursions.steps.${key}.title`),
      content: t(`tour.incursions.steps.${key}.content`),
      // Neither renders before the first Incursion is in the game data.
      data: { optional: true },
    })
    const shared = [
      step("incursions-rules", "rules"),
      step("incursions-list", "list"),
    ]
    return { desktop: shared, mobile: shared }
  }, [t])

  useTourPageSteps(steps)
}
