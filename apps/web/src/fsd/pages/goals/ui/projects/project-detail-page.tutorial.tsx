import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

/**
 * A project's detail-route guided tour (project-management spec: the current project's own row,
 * the project-switcher selector, and its goal table). Split from the single combined
 * `useProjectsTutorial` this page previously shared with the list route's own tour.
 */
export function useProjectDetailTutorial() {
  const { t } = useTranslation()
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key: "row" | "selector" | "goals"
    ): Step => ({
      target,
      title: t(`tour.projectDetail.steps.${key}.title`),
      content: t(`tour.projectDetail.steps.${key}.content`),
    })
    const shared = [
      createStep('[data-testid^="project-row-"]', "row"),
      createStep('[data-testid="projects-goal-project-select"]', "selector"),
      createStep('[data-testid="project-detail-page"]', "goals"),
    ]
    return { desktop: shared, mobile: shared }
  }, [t])
  useTourPageSteps(steps)
}
