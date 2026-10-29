import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

/**
 * The Goals page's guided tour (goals-navigation spec: the project scope chips, then the status
 * filter / Type-Group filters / Planning Settings row) plus how to reprioritize the one account-wide
 * order. Mirrors the Dailies tutorials' shape (registered via `useTourPageSteps`).
 */
export function useGoalsOverviewTutorial() {
  const { t } = useTranslation()
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key:
        | "projectScope"
        | "statusFilter"
        | "filters"
        | "seasonFit"
        | "viewToggle"
        | "select"
        | "bulkActions"
        | "createGoal"
        | "planningSettings"
        | "reprioritize"
        | "orderHint"
        | "list"
    ): Step => ({
      target,
      title: t(`tour.overview.steps.${key}.title`),
      content: t(`tour.overview.steps.${key}.content`),
    })
    // The chip row is one shared component on both breakpoints, so the step target is the same.
    const before = [
      createStep('[data-testid="goals-project-scope"]', "projectScope"),
      createStep('[data-testid="goals-status-filter"]', "statusFilter"),
      createStep('[data-testid="goals-type-filter"]', "filters"),
      createStep('[data-testid="goals-season-fit"]', "seasonFit"),
    ]
    const after = [
      createStep('[data-testid="goals-order-hint"]', "orderHint"),
      createStep('[data-testid="goals-create-goal"]', "createGoal"),
      createStep('[data-testid="goals-planning-settings"]', "planningSettings"),
      createStep('[data-testid="goals-page"]', "list"),
    ]
    // Desktop rows and cards carry a drag handle directly; mobile has a dedicated reorder mode, so the
    // reprioritize step targets different markup with the same content. The Table/Cards switch is
    // desktop-only (mobile is always cards); the handle and select-all targets exist in both views.
    return {
      desktop: [
        ...before,
        createStep('[data-testid="goals-view-toggle"]', "viewToggle"),
        createStep('[data-testid="goal-row-drag-handle"]', "reprioritize"),
        createStep('[data-testid="goals-select-all"]', "select"),
        createStep('[data-testid="goals-bulk-actions"]', "bulkActions"),
        ...after,
      ],
      mobile: [
        ...before,
        createStep(
          '[data-testid="goals-mobile-reorder-toggle"]',
          "reprioritize"
        ),
        createStep('[data-testid="goals-mobile-select-toggle"]', "select"),
        ...after,
      ],
    }
  }, [t])
  useTourPageSteps(steps)
}
