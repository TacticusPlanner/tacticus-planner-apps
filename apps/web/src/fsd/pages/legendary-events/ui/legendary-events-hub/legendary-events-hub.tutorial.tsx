import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import type { TourPageSteps } from "@/shared/tour"

const HUB_TOUR_TARGETS = {
  active: '[data-testid="legendary-events-group-active"]',
  noActive: '[data-testid="legendary-events-no-active"]',
  upcoming:
    '[data-testid="legendary-events-group-upcoming"] [data-testid="legendary-event-card"]',
} as const

/** The hub's page tour: the Active group (or the "nothing running" line), then the first upcoming
 *  row when there is one. Desktop and mobile share targets; only placement differs. */
export function useLegendaryEventsHubTutorial({
  hasActive,
  hasUpcoming,
}: {
  hasActive: boolean
  hasUpcoming: boolean
}): TourPageSteps {
  const { t } = useTranslation("legendaryEvents")
  return useMemo(() => {
    const step = (
      key: keyof typeof HUB_TOUR_TARGETS,
      placement: Step["placement"]
    ): Step => ({
      target: HUB_TOUR_TARGETS[key],
      placement,
      title: t(`tour.hub.steps.${key}.title`),
      content: t(`tour.hub.steps.${key}.content`),
    })
    const build = (placement: Step["placement"]) => [
      step(hasActive ? "active" : "noActive", "bottom"),
      ...(hasUpcoming ? [step("upcoming", placement)] : []),
    ]
    return { desktop: build("right"), mobile: build("bottom") }
  }, [hasActive, hasUpcoming, t])
}
