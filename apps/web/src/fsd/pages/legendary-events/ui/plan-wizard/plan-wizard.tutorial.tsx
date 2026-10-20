import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import type { TourPageSteps } from "@/shared/tour"

const PLAN_TOUR_TARGETS = {
  stepper: '[data-testid="plan-wizard-stepper"]',
  progress: '[data-testid="plan-wizard-progress"]',
  runInputs: '[data-testid="plan-wizard-run-inputs"]',
  target: '[data-testid="plan-wizard-target"]',
  bestStep: '[data-testid="plan-wizard-best-step"]',
  footer: '[data-testid="plan-wizard-footer"]',
} as const

/**
 * The 1-click plan tour (spec: every page has a tour): the steps (a stepper on desktop, the
 * "Step N of 5" header on mobile), the run inputs, the target choice with its verdicts, the best step within
 * reach, then Back / Next.
 */
export function usePlanWizardTutorial(): TourPageSteps {
  const { t } = useTranslation("legendaryEvents")
  return useMemo(() => {
    const step = (
      key: keyof typeof PLAN_TOUR_TARGETS,
      placement: Step["placement"]
    ): Step => ({
      target: PLAN_TOUR_TARGETS[key],
      placement,
      title: t(`tour.planWizard.steps.${key}.title`),
      content: t(`tour.planWizard.steps.${key}.content`),
    })
    const shared = [
      step("runInputs", "bottom"),
      step("target", "bottom"),
      step("bestStep", "top"),
      step("footer", "top"),
    ]
    return {
      desktop: [step("stepper", "right"), ...shared],
      mobile: [step("progress", "bottom"), ...shared],
    }
  }, [t])
}
