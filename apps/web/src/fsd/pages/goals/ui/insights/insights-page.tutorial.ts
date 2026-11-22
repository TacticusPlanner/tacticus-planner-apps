import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey = "toolbar" | "outlook" | "holdingBack" | "farming" | "missing"

/**
 * Joyride tour for Insights: the toolbar (project and Locations), then the report read top to
 * bottom. The report's cards are optional steps, since none render while the plan loads, fails or
 * has no active goals. Desktop and mobile share the targets.
 */
export function useInsightsTutorial() {
  const { t } = useTranslation()

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey, optional = true): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.insights.steps.${key}.title`),
      content: t(`tour.insights.steps.${key}.content`),
      ...(optional ? { data: { optional: true } } : {}),
    })
    const shared = [
      step("insights-toolbar", "toolbar", false),
      step("insights-outlook", "outlook"),
      step("insights-holding-back", "holdingBack"),
      step("insights-farming", "farming"),
      step("insights-missing", "missing"),
    ]
    return { desktop: shared, mobile: shared }
  }, [t])

  useTourPageSteps(steps)
}
