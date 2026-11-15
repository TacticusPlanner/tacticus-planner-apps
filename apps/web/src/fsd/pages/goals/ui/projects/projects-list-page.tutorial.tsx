import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

/**
 * Projects list route's guided tour (project-management spec: the on-page project list and the
 * "New project" FAB, whose step copy also introduces each row's action menu - Create goal, Manage
 * goals, Edit, Archive/Restore), plus a step on the row menu's Move goals to top.
 */
export function useProjectsListTutorial() {
  const { t } = useTranslation()
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key: "list" | "moveGoals" | "newProject"
    ): Step => ({
      target,
      title: t(`tour.projectsList.steps.${key}.title`),
      content: t(`tour.projectsList.steps.${key}.content`),
    })
    const shared = [
      createStep('[data-testid="project-list"]', "list"),
      // The first live row's menu, where Move goals to top sits (add-move-project-goals); skipped
      // while there is no row.
      createStep('[data-testid^="project-row-actions-"]', "moveGoals"),
      createStep('[data-testid="projects-new-project"]', "newProject"),
    ]
    return { desktop: shared, mobile: shared }
  }, [t])
  useTourPageSteps(steps)
}
