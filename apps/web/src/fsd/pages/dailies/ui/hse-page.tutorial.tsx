import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps, type TourPageSteps } from "@/shared/tour"

type StepKey = "switcher" | "status" | "farm" | "top"

/**
 * Joyride tour for Dailies > HSE: the event switcher, the status line and, when the shown instance
 * has them, the farm list and the top-10 lists. `hasSwitcher` and `hasLists` gate steps whose
 * targets are not rendered (calendar loading or failed; a past or rule-less event), since
 * react-joyride cannot recover from a target that never appears. Desktop and mobile share the same
 * targets: the switcher only moves to its own row below 768px.
 */
export function useHseTutorial({
  hasSwitcher,
  hasLists,
}: {
  hasSwitcher: boolean
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
      ...(hasLists
        ? [step("hse-raids", "farm"), step("hse-top-lists", "top")]
        : []),
    ]

    return { desktop: shared, mobile: shared }
  }, [t, hasSwitcher, hasLists])

  useTourPageSteps(steps)
}
