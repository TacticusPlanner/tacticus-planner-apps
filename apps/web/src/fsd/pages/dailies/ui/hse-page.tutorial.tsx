import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps, type TourPageSteps } from "@/shared/tour"

type StepKey =
  | "switcher"
  | "status"
  | "details"
  | "milestones"
  | "projection"
  | "teams"
  | "farm"
  | "top"

/**
 * Joyride tour for Dailies > HSE: the event switcher, the status line and, when the shown instance
 * has them, the event details, the milestone grid, the points projection, the event teams, the farm
 * list and the top-10 lists. The `has*` flags gate steps whose targets are not rendered (calendar loading or
 * failed; no scoring data; a past, Global or rule-less event), since react-joyride cannot recover
 * from a target that never appears. Desktop and mobile share the same targets: below 768px the
 * switcher moves to its own row and the sections stack, in the same order (the event teams switch
 * to a segmented mode control inside the same `hse-teams` target).
 */
export function useHseTutorial({
  hasSwitcher,
  hasDetails,
  hasMilestones,
  hasProjection,
  hasTeams,
  hasLists,
}: {
  hasSwitcher: boolean
  hasDetails: boolean
  hasMilestones: boolean
  hasProjection: boolean
  hasTeams: boolean
  hasLists: boolean
}) {
  const { t } = useTranslation("dailies")

  const steps = useMemo<TourPageSteps>(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.hse.steps.${key}.title`),
      content: t(`tour.hse.steps.${key}.content`),
    })

    const shared: Step[] = [
      ...(hasSwitcher ? [step("hse-event-switcher", "switcher")] : []),
      step("hse-status", "status"),
      ...(hasDetails ? [step("hse-event-details", "details")] : []),
      ...(hasMilestones ? [step("hse-milestones", "milestones")] : []),
      ...(hasProjection ? [step("hse-projection", "projection")] : []),
      ...(hasTeams ? [step("hse-teams", "teams")] : []),
      ...(hasLists
        ? [step("hse-raids", "farm"), step("hse-top-lists", "top")]
        : []),
    ]

    return { desktop: shared, mobile: shared }
  }, [
    t,
    hasSwitcher,
    hasDetails,
    hasMilestones,
    hasProjection,
    hasTeams,
    hasLists,
  ])

  useTourPageSteps(steps)
}
