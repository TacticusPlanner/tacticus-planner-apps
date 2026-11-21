import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey = "summary" | "stories"

/**
 * Joyride tour for the Campaigns progress page: the Normal and Mirror totals, then the story cards
 * with their tracks and the medals editor. Desktop and mobile share the targets; only the cards'
 * layout differs (two columns vs stacked).
 */
export function useCampaignsTutorial() {
  const { t } = useTranslation()

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.campaigns.steps.${key}.title`),
      content: t(`tour.campaigns.steps.${key}.content`),
    })
    const shared = [
      step("campaigns-summary", "summary"),
      step("campaigns-stories", "stories"),
    ]
    return { desktop: shared, mobile: shared }
  }, [t])

  useTourPageSteps(steps)
}
