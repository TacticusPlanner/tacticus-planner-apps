/* eslint-disable react-refresh/only-export-components */
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps, type TourPageSteps } from "@/shared/tour"

/**
 * The create-goal sheet's own onboarding tour (plan: acquisition-source picker,
 * tacticus-planner-apps#103). One step for the current status (the full card at or above 768px, the
 * one-line summary below it), one for "Add milestone" (a ladder of targets for one unit), one for
 * explaining that Campaigns/Onslaught/Shops sources combine, one for the project picker's inline
 * Create action, and one for the problem count beside Create goal. Steps whose target isn't on screen
 * (no unit chosen, no problem) are skipped by Joyride. The targets are `data-testid`s that both shells
 * render (centered dialog at or above 768px, bottom sheet below).
 */
export function useCreateGoalSheetTutorial(): TourPageSteps {
  const { t } = useTranslation()

  // The first enabled Rank, Ascension or Ability card's milestone list (goal-target-milestones);
  // skipped by Joyride until one of those cards is shown.
  const milestones = useMemo<Step>(
    () => ({
      target: MILESTONE_TARGET,
      title: t("tour.createGoal.steps.milestones.title"),
      content: t("tour.createGoal.steps.milestones.content"),
    }),
    [t]
  )

  const acquisitionSources = useMemo<Step>(
    () => ({
      target: '[data-testid="create-goal-acquisition-sources"]',
      title: t("tour.createGoal.steps.acquisitionSources.title"),
      content: t("tour.createGoal.steps.acquisitionSources.content"),
    }),
    [t]
  )

  // Skipped by Joyride unless a Rank/Upgrade/MoW-Ability range needs a Mythic material
  // (add-mythic-material-shop-sources).
  const mythicMaterialSources = useMemo<Step>(
    () => ({
      target: '[data-testid="goal-mythic-material-sources"]',
      title: t("tour.createGoal.steps.mythicMaterialSources.title"),
      content: t("tour.createGoal.steps.mythicMaterialSources.content"),
    }),
    [t]
  )

  const projects = useMemo<Step>(
    () => ({
      target: '[data-testid="create-goal-projects"]',
      title: t("tour.createGoal.steps.projects.title"),
      content: t("tour.createGoal.steps.projects.content"),
    }),
    [t]
  )

  const statusStep = (target: string): Step => ({
    target,
    title: t("tour.createGoal.steps.status.title"),
    content: t("tour.createGoal.steps.status.content"),
  })
  const desktopStatus = useMemo<Step>(
    () => statusStep('[data-testid="create-goal-unit-info"]'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  )
  const mobileStatus = useMemo<Step>(
    () => statusStep('[data-testid="create-goal-unit-status-summary"]'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  )

  // Skipped by Joyride while the form has no blocking problem.
  const issues = useMemo<Step>(
    () => ({
      target: '[data-testid="create-goal-issue-summary"]',
      title: t("tour.createGoal.steps.issues.title"),
      content: t("tour.createGoal.steps.issues.content"),
    }),
    [t]
  )

  return useMemo<TourPageSteps>(() => {
    const shared = [
      milestones,
      acquisitionSources,
      mythicMaterialSources,
      projects,
    ]
    return {
      desktop: [desktopStatus, ...shared, issues],
      mobile: [mobileStatus, ...shared, issues],
    }
  }, [
    desktopStatus,
    mobileStatus,
    milestones,
    acquisitionSources,
    mythicMaterialSources,
    projects,
    issues,
  ])
}

const MILESTONE_TARGET = ["rank", "ascension", "ability"]
  .map((kind) => `[data-testid="create-goal-${kind}-milestones"]`)
  .join(", ")

/**
 * Registers the sheet's tour steps only while it's open. `CreateGoalSheet` is mounted
 * permanently at the app-shell level (`open` just toggles visibility — see app-shell.tsx), so the
 * registration lives in a child gated by `open`: page-tour registrations stack (see
 * `registerPageSteps` in `tour-provider.tsx`), so the sheet's steps are the active tour while it is
 * open and closing it restores the underlying page's own steps.
 */
export function CreateGoalSheetTourRegistration() {
  useTourPageSteps(useCreateGoalSheetTutorial(), { overlay: true })
  return null
}
