/* eslint-disable react-refresh/only-export-components */
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps, type TourPageSteps } from "@/shared/tour"

/**
 * The create-goal sheet's own onboarding tour (plan: acquisition-source picker,
 * tacticus-planner-apps#103) — the sheet had no tour coverage before this change. One step for
 * now, explaining that Campaigns/Onslaught/Shops sources combine. Desktop and mobile share the
 * same single step (no viewport-specific placement need yet).
 */
export function useCreateGoalSheetTutorial(): TourPageSteps {
  const { t } = useTranslation()

  const acquisitionSources = useMemo<Step>(
    () => ({
      target: '[data-testid="create-goal-acquisition-sources"]',
      title: t("tour.createGoal.steps.acquisitionSources.title"),
      content: t("tour.createGoal.steps.acquisitionSources.content"),
    }),
    [t]
  )

  return useMemo<TourPageSteps>(
    () => ({ desktop: [acquisitionSources], mobile: [acquisitionSources] }),
    [acquisitionSources]
  )
}

/**
 * Registers the sheet's tour steps only while it's open. `CreateGoalSheet` is mounted
 * permanently at the app-shell level (`open` just toggles visibility — see app-shell.tsx), so the
 * registration lives in a child gated by `open`: page-tour registrations stack (see
 * `registerPageSteps` in `tour-provider.tsx`), so the sheet's steps are the active tour while it is
 * open and closing it restores the underlying page's own steps.
 */
export function CreateGoalSheetTourRegistration() {
  useTourPageSteps(useCreateGoalSheetTutorial())
  return null
}
