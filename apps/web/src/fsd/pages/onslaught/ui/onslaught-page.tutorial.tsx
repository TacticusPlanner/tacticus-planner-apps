import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey = "alliances" | "save"

/**
 * Joyride tour for the Onslaught progress page: the alliance cards, and the help text standing in
 * for the unsaved-changes bar (which only renders once there are edits). On desktop the three cards
 * sit in one row and are highlighted together; on mobile they stack, so the first card stands in.
 */
export function useOnslaughtTutorial() {
  const { t } = useTranslation()

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.onslaught.steps.${key}.title`),
      content: t(`tour.onslaught.steps.${key}.content`),
    })

    return {
      desktop: [
        step("onslaught-alliance-cards", "alliances"),
        step("onslaught-progress-help", "save"),
      ],
      mobile: [
        step("imperial-onslaught-card", "alliances"),
        step("onslaught-progress-help", "save"),
      ],
    }
  }, [t])

  useTourPageSteps(steps)
}
