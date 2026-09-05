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
 * permanently at the app-shell level (`open` just toggles visibility — see app-shell.tsx), and
 * the shared tour provider keeps a single last-writer-wins `pageSteps` value with no stack (see
 * `tour-provider.tsx`); calling `useTourPageSteps` unconditionally from inside `CreateGoalSheet`
 * would clobber whatever page's tour is registered on every one of the sheet's re-renders, open
 * or not. Mounting this as a child gated by `open` scopes the registration to the hook's own
 * effect lifecycle instead: it registers on mount (open) and calls `setPageSteps(null)` on
 * unmount (close) — cleaner, but that still leaves the tour on the generic shell default rather
 * than restoring the underlying page's own steps until that page next remounts (e.g. a
 * navigation), since closing this sheet doesn't itself re-trigger the page's own registration
 * effect. Accepted as a narrow, self-healing gap rather than building stacked/nested page-steps
 * support into the tour provider for this one case.
 */
export function CreateGoalSheetTourRegistration() {
  useTourPageSteps(useCreateGoalSheetTutorial())
  return null
}
