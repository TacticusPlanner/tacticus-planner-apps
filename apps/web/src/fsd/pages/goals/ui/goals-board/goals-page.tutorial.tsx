import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

/**
 * The Goals page's guided tour (goals-navigation spec: the project scope chips, then the status
 * filter / Type-Group filters / Planning Settings row) plus how to reprioritize the one account-wide
 * order. Mirrors the Dailies tutorials' shape (registered via `useTourPageSteps`).
 */
export function useGoalsOverviewTutorial(deadlineScope = false) {
  const { t } = useTranslation()
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key:
        | "projectScope"
        | "statusFilter"
        | "filters"
        | "seasonFit"
        | "deadlineFit"
        | "viewToggle"
        | "viewOptions"
        | "select"
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
    ]
    // With a targeted project's deadline chosen, its header follows (project-deadline-fit).
    const deadline = deadlineScope
      ? [createStep('[data-testid="goals-deadline-fit"]', "deadlineFit")]
      : []
    // Mobile has no Create goal in the toolbar (the bottom nav's Add Goal is the page action).
    const after = (mobile: boolean) => [
      createStep('[data-testid="goals-order-hint"]', "orderHint"),
      ...(mobile
        ? []
        : [createStep('[data-testid="goals-create-goal"]', "createGoal")]),
      createStep('[data-testid="goals-planning-settings"]', "planningSettings"),
      createStep('[data-testid="goals-page"]', "list"),
    ]
    // Desktop rows and cards carry a drag handle directly; mobile has a dedicated reorder mode, so the
    // reprioritize step targets different markup with the same content. The handle and select-all
    // targets exist in both views. The bulk actions bar shows only while goals are selected, so the
    // select step mentions it instead of pointing at it. On mobile the View controls (Layout, Group
    // by, Season fit) sit behind the toolbar's View button, which gets one step.
    return {
      desktop: [
        ...before,
        createStep('[data-testid="goals-season-fit"]', "seasonFit"),
        ...deadline,
        createStep('[data-testid="goals-view-toggle"]', "viewToggle"),
        createStep('[data-testid="goal-row-drag-handle"]', "reprioritize"),
        createStep('[data-testid="goals-select-all"]', "select"),
        ...after(false),
      ],
      mobile: [
        ...before,
        ...deadline,
        createStep('[data-testid="goals-view-options"]', "viewOptions"),
        createStep(
          '[data-testid="goals-mobile-reorder-toggle"]',
          "reprioritize"
        ),
        createStep('[data-testid="goals-mobile-select-toggle"]', "select"),
        ...after(true),
      ],
    }
  }, [t, deadlineScope])
  useTourPageSteps(steps)
}
