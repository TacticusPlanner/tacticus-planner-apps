import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

/**
 * Projects' guided tour (project-management spec: the on-page project list, the narrowed
 * create/edit Sheet, and the dedicated goal-list `ProjectSelect`) — Projects previously had no
 * tutorial coverage at all. Co-located with `projects-page.tsx` (Projects stays inside `pages/goals`
 * - see `design.md` Decision 6). Mirrors the Dailies tutorials' shape (one shared step list for
 * desktop and mobile, registered via `useTourPageSteps`).
 */
export function useProjectsTutorial() {
  const { t } = useTranslation()
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key: "list" | "newProject" | "selector" | "goals"
    ): Step => ({
      target,
      title: t(`tour.projects.steps.${key}.title`),
      content: t(`tour.projects.steps.${key}.content`),
    })
    const shared = [
      createStep('[data-testid="project-list"]', "list"),
      createStep('[data-testid="projects-new-project"]', "newProject"),
      createStep('[data-testid="projects-goal-project-select"]', "selector"),
      createStep('[data-testid="projects-page"]', "goals"),
    ]
    return { desktop: shared, mobile: shared }
  }, [t])
  useTourPageSteps(steps)
}
