import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

/**
 * The Global Plan's guided tour: the one account-wide order every project filters (and that Paused
 * goals keep their place in), how to reprioritize it, and where new goals are created. Desktop rows
 * carry a drag handle directly; mobile has a dedicated reorder mode, so the middle step targets
 * different markup with the same content.
 */
export function useGlobalPlanTutorial() {
  const { t } = useTranslation()
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key: "intro" | "reprioritize" | "createGoal"
    ): Step => ({
      target,
      title: t(`tour.globalPlan.steps.${key}.title`),
      content: t(`tour.globalPlan.steps.${key}.content`),
    })
    const intro = createStep('[data-testid="global-plan-intro"]', "intro")
    const createGoal = createStep(
      '[data-testid="global-plan-create-goal"]',
      "createGoal"
    )
    return {
      desktop: [
        intro,
        createStep('[data-testid="goal-row-drag-handle"]', "reprioritize"),
        createGoal,
      ],
      mobile: [
        intro,
        createStep(
          '[data-testid="global-plan-mobile-reorder-toggle"]',
          "reprioritize"
        ),
        createGoal,
      ],
    }
  }, [t])
  useTourPageSteps(steps)
}
