import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

/**
 * Overview's guided tour (goals-navigation spec: the consolidated status filter / Type-Sort-Group
 * filters / Planning Settings row) — Overview previously had no tutorial coverage at all. Mirrors
 * the Dailies tutorials' shape (one shared step list for desktop and mobile, registered via
 * `useTourPageSteps`).
 */
export function useGoalsOverviewTutorial() {
  const { t } = useTranslation()
  const steps = useMemo(() => {
    const createStep = (
      target: string,
      key: "statusFilter" | "filters" | "planningSettings" | "list"
    ): Step => ({
      target,
      title: t(`tour.overview.steps.${key}.title`),
      content: t(`tour.overview.steps.${key}.content`),
    })
    const shared = [
      createStep('[data-testid="goals-status-filter"]', "statusFilter"),
      createStep('[data-testid="goals-type-filter"]', "filters"),
      createStep('[data-testid="goals-planning-settings"]', "planningSettings"),
      createStep('[data-testid="goals-page"]', "list"),
    ]
    return { desktop: shared, mobile: shared }
  }, [t])
  useTourPageSteps(steps)
}
