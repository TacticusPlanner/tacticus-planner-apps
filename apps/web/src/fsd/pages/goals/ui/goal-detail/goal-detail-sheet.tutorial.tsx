/* eslint-disable react-refresh/only-export-components */
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps, type TourPageSteps } from "@/shared/tour"

/**
 * The goal detail sheet's own onboarding tour: one step pointing at the Edit target action, which only
 * exists inside the sheet (so the Goals page tour can't target it). Desktop and mobile share the step —
 * the sheet renders the same markup at both breakpoints.
 */
export function useGoalDetailSheetTutorial(): TourPageSteps {
  const { t } = useTranslation()

  const editTarget = useMemo<Step>(
    () => ({
      target: '[data-testid="goal-detail-edit-target"]',
      title: t("tour.goalDetail.steps.editTarget.title"),
      content: t("tour.goalDetail.steps.editTarget.content"),
    }),
    [t]
  )

  return useMemo<TourPageSteps>(
    () => ({ desktop: [editTarget], mobile: [editTarget] }),
    [editTarget]
  )
}

/**
 * Registers the step only while an eligible goal's detail is open. Page-tour registrations stack, so
 * the sheet's step is the active tour while it is open and closing the sheet restores the Goals page's
 * own steps (see `registerPageSteps` in `tour-provider.tsx`).
 */
export function GoalDetailSheetTourRegistration() {
  useTourPageSteps(useGoalDetailSheetTutorial())
  return null
}
