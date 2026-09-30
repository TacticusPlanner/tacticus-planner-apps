/* eslint-disable react-refresh/only-export-components */
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps, type TourPageSteps } from "@/shared/tour"

/**
 * The Edit goal dialog's own onboarding tour: the target editors, the priority position and the project
 * picker, all `data-testid`s inside the form body. Both shells (centered dialog at or above 768px,
 * bottom sheet below) render the same body, so desktop and mobile share the steps; a step whose target
 * the goal does not have (an Unlock goal has no target) is skipped by Joyride.
 */
export function useGoalEditDialogTutorial(): TourPageSteps {
  const { t } = useTranslation()

  const target = useMemo<Step>(
    () => ({
      target: '[data-testid="goal-edit-target"]',
      title: t("tour.editGoal.steps.target.title"),
      content: t("tour.editGoal.steps.target.content"),
    }),
    [t]
  )

  const priority = useMemo<Step>(
    () => ({
      target: '[data-testid="goal-edit-priority"]',
      title: t("tour.editGoal.steps.priority.title"),
      content: t("tour.editGoal.steps.priority.content"),
    }),
    [t]
  )

  const projects = useMemo<Step>(
    () => ({
      target: '[data-testid="goal-edit-projects"]',
      title: t("tour.editGoal.steps.projects.title"),
      content: t("tour.editGoal.steps.projects.content"),
    }),
    [t]
  )

  return useMemo<TourPageSteps>(
    () => ({
      desktop: [target, priority, projects],
      mobile: [target, priority, projects],
    }),
    [target, priority, projects]
  )
}

/**
 * Registers the steps only while the dialog is open. Page-tour registrations stack, so the dialog's
 * steps are the active tour while it is open and closing it restores the Goals page's own steps (see
 * `registerPageSteps` in `tour-provider.tsx`).
 */
export function GoalEditDialogTourRegistration() {
  useTourPageSteps(useGoalEditDialogTutorial())
  return null
}
