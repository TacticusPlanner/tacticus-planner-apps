import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

/**
 * The Goals page's guided tour (goals-navigation spec: the consolidated status filter / Type-Group
 * filters / Planning Settings row) plus how to reprioritize the one account-wide order. Mirrors the
 * Dailies tutorials' shape (registered via `useTourPageSteps`).
 */
export function useGoalsOverviewTutorial() {
  const { t } = useTranslation()
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key:
        | "createProject"
        | "statusFilter"
        | "filters"
        | "projectFilter"
        | "density"
        | "createGoal"
        | "planningSettings"
        | "reprioritize"
        | "list"
    ): Step => ({
      target,
      title: t(`tour.overview.steps.${key}.title`),
      content: t(`tour.overview.steps.${key}.content`),
    })
    const before = [
      createStep(
        '[data-testid="overview-quicknav-create-project"]',
        "createProject"
      ),
      createStep('[data-testid="goals-status-filter"]', "statusFilter"),
      createStep('[data-testid="goals-type-filter"]', "filters"),
      createStep('[data-testid="goals-project-filter"]', "projectFilter"),
      createStep('[data-testid="goals-density-toggle"]', "density"),
    ]
    const after = [
      createStep('[data-testid="goals-create-goal"]', "createGoal"),
      createStep('[data-testid="goals-planning-settings"]', "planningSettings"),
      createStep('[data-testid="goals-page"]', "list"),
    ]
    // Desktop rows carry a drag handle directly; mobile has a dedicated reorder mode, so the
    // reprioritize step targets different markup with the same content.
    return {
      desktop: [
        ...before,
        createStep('[data-testid="goal-row-drag-handle"]', "reprioritize"),
        ...after,
      ],
      mobile: [
        ...before,
        createStep(
          '[data-testid="goals-mobile-reorder-toggle"]',
          "reprioritize"
        ),
        ...after,
      ],
    }
  }, [t])
  useTourPageSteps(steps)
}
