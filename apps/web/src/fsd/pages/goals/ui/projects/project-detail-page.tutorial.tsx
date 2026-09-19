import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

/**
 * A project's detail-route guided tour (semantic header, bulk goal assembly, inline goal
 * reprioritization, project switcher, goal list, and the per-row menu where project removal lives).
 * Split from the single combined `useProjectsTutorial` this page previously shared with the list
 * route's own tour.
 */
export function useProjectDetailTutorial() {
  const { t } = useTranslation()
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key:
        | "header"
        | "addGoals"
        | "reprioritize"
        | "selector"
        | "goals"
        | "rowActions"
    ): Step => ({
      target,
      title: t(`tour.projectDetail.steps.${key}.title`),
      content: t(`tour.projectDetail.steps.${key}.content`),
    })
    const common = [
      createStep('[data-testid="project-detail-header"]', "header"),
      createStep('[data-testid="project-add-goals"]', "addGoals"),
    ]
    const trailing = [
      createStep('[data-testid="projects-goal-project-select"]', "selector"),
      createStep('[data-testid="project-detail-goals"]', "goals"),
      createStep('[data-testid="goal-row-actions"]', "rowActions"),
    ]
    // Desktop shows a drag handle on every row directly; mobile has a dedicated reorder-mode
    // toggle instead (add-inline-goal-reprioritize) — different targets, same step content.
    return {
      desktop: [
        ...common,
        createStep('[data-testid="goal-row-drag-handle"]', "reprioritize"),
        ...trailing,
      ],
      mobile: [
        ...common,
        createStep(
          '[data-testid="project-mobile-reorder-toggle"]',
          "reprioritize"
        ),
        ...trailing,
      ],
    }
  }, [t])
  useTourPageSteps(steps)
}
