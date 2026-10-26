import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import type { TourPageSteps } from "@/shared/tour"

const PLAN_TOUR_TARGETS = {
  stepper: '[data-testid="plan-wizard-stepper"]',
  progress: '[data-testid="plan-wizard-progress"]',
  horizon: '[data-testid="plan-wizard-horizon"]',
  targetCards: '[data-testid="plan-wizard-target-cards"]',
  // On mobile the stacked cards are taller than the screen, which pushes the tooltip above it.
  firstTargetCard: '[data-testid="plan-wizard-target-option"]',
  assumptions: '[data-testid="plan-wizard-run-inputs"]',
  summary: '[data-testid="plan-wizard-summary"]',
  footer: '[data-testid="plan-wizard-footer"]',
} as const

/**
 * The 1-click plan tour (spec: wizard tour and analytics): the steps (a stepper on desktop, the
 * step header with its chips on mobile), the run picker (absent when the plan plays one run), the
 * target cards, the Assumptions panel, the plan summary (the rail on desktop, the strip on mobile),
 * then Back / Next (the bottom bar on mobile).
 */
export function usePlanWizardTutorial(): TourPageSteps {
  const { t } = useTranslation("legendaryEvents")
  return useMemo(() => {
    const step = (
      key: Exclude<keyof typeof PLAN_TOUR_TARGETS, "firstTargetCard">,
      placement: Step["placement"],
      target: string = PLAN_TOUR_TARGETS[key]
    ): Step => ({
      target,
      placement,
      title: t(`tour.planWizard.steps.${key}.title`),
      content: t(`tour.planWizard.steps.${key}.content`),
    })
    const horizon: Step = {
      ...step("horizon", "bottom"),
      data: { optional: true },
    }
    return {
      desktop: [
        step("stepper", "right"),
        horizon,
        step("targetCards", "bottom"),
        step("assumptions", "top"),
        step("summary", "bottom"),
        step("footer", "top"),
      ],
      mobile: [
        step("progress", "bottom"),
        horizon,
        step("targetCards", "bottom", PLAN_TOUR_TARGETS.firstTargetCard),
        step("assumptions", "top"),
        step("summary", "bottom"),
        step("footer", "top"),
      ],
    }
  }, [t])
}
