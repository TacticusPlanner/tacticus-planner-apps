import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

/**
 * A project's detail-route guided tour (semantic header, unit reprioritization when available,
 * project switcher, and goal list). Split from the single combined
 * `useProjectsTutorial` this page previously shared with the list route's own tour.
 */
export function useProjectDetailTutorial() {
  const { t } = useTranslation()
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key: "header" | "reprioritize" | "selector" | "goals"
    ): Step => ({
      target,
      title: t(`tour.projectDetail.steps.${key}.title`),
      content: t(`tour.projectDetail.steps.${key}.content`),
    })
    const shared = [
      createStep('[data-testid="project-detail-header"]', "header"),
      createStep('[data-testid="project-reprioritize-units"]', "reprioritize"),
      createStep('[data-testid="projects-goal-project-select"]', "selector"),
      createStep('[data-testid="project-detail-goals"]', "goals"),
    ]
    return { desktop: shared, mobile: shared }
  }, [t])
  useTourPageSteps(steps)
}
