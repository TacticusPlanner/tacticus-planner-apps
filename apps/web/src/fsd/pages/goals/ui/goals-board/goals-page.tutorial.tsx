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
        | "selectDesktop"
        | "createGoal"
        | "planningSettings"
        | "reprioritize"
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
      ...(mobile
        ? []
        : [createStep('[data-testid="goals-create-goal"]', "createGoal")]),
      createStep('[data-testid="goals-planning-settings"]', "planningSettings"),
      createStep('[data-testid="goals-page"]', "list"),
    ]
    // Desktop rows and cards carry a drag handle directly; mobile has a dedicated reorder mode, so the
    // reprioritize step targets different markup with the same content (and also explains the
    // order, which no on-page hint does). Cards point the select step at Select goals; the desktop
    // table has no select mode, so the step points at its header's select-all checkbox instead. On mobile the View controls (Layout, Group
    // by, Sort, Season fit) sit behind the toolbar's View button, which gets one step.
    return {
      desktop: [
        ...before,
        createStep('[data-testid="goals-season-fit"]', "seasonFit"),
        ...deadline,
        createStep('[data-testid="goals-view-toggle"]', "viewToggle"),
        createStep('[data-testid="goal-row-drag-handle"]', "reprioritize"),
        createStep(
          '[data-testid="goals-select-toggle"], [data-testid="goals-select-all"]',
          "selectDesktop"
        ),
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
        createStep('[data-testid="goals-select-toggle"]', "select"),
        ...after(true),
      ],
    }
  }, [t, deadlineScope])
  useTourPageSteps(steps)
}
