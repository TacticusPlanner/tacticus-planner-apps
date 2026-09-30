import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

/**
 * Projects list route's guided tour (project-management spec: the on-page project list and the
 * "New project" FAB, whose step copy also introduces each row's action menu - Create goal, Manage
 * goals, Edit, Archive/Restore).
 */
export function useProjectsListTutorial() {
  const { t } = useTranslation()
  const steps = useMemo(() => {
    const createStep = (target: string, key: "list" | "newProject"): Step => ({
      target,
      title: t(`tour.projectsList.steps.${key}.title`),
      content: t(`tour.projectsList.steps.${key}.content`),
    })
    const shared = [
      createStep('[data-testid="project-list"]', "list"),
      createStep('[data-testid="projects-new-project"]', "newProject"),
    ]
    return { desktop: shared, mobile: shared }
  }, [t])
  useTourPageSteps(steps)
}
