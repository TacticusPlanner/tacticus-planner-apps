import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"
import type { TourPageSteps } from "@/shared/tour"

type StepKey =
  | "switcher"
  | "header"
  | "tracker"
  | "allMissions"
  | "raids"
  | "suggestions"
  | "tokens"
  | "pace"

/**
 * Joyride tour for Dailies > HRE: the event switcher, the event header, then (with an event) the
 * current mission and the suggestions folded under its first objective that has any, the pace and
 * the tokens needed on a running event, the campaign outlook, and the mission list, in the page's
 * order. The `has*` flags and `suggestionsTarget` gate steps whose targets are not rendered, since
 * react-joyride cannot recover from a target that never appears. Desktop points at the mission
 * list after the tracker; mobile at its "All missions" toggle, last, as the page orders it.
 */
export function useHreTutorial({
  hasSwitcher = false,
  hasEvent,
  hasRaids = hasEvent,
  running,
  suggestionsTarget,
  hasTokens,
}: {
  /** The event switcher renders (the calendar has loaded). */
  hasSwitcher?: boolean
  hasEvent: boolean
  /** The raids section renders (an event that is not past). */
  hasRaids?: boolean
  running: boolean
  /** The test id of the first objective's suggestions, or null when no objective has a fold. */
  suggestionsTarget: string | null
  hasTokens: boolean
}) {
  const { t } = useTranslation("dailies")

  const steps = useMemo<TourPageSteps>(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.hre.steps.${key}.title`),
      content: t(`tour.hre.steps.${key}.content`),
    })
    const live = (keys: Step[]) => (running ? keys : [])
    const switcher = hasSwitcher ? [step("hre-event-switcher", "switcher")] : []
    const tracker = live([
      step("hre-tracker", "tracker"),
      ...(suggestionsTarget ? [step(suggestionsTarget, "suggestions")] : []),
    ])
    const side = hasEvent
      ? [
          ...live([step("hre-pace", "pace")]),
          ...(hasTokens ? [step("hre-tokens", "tokens")] : []),
          ...(hasRaids ? [step("hre-raids", "raids")] : []),
        ]
      : []

    return {
      desktop: [
        ...switcher,
        step("hre-status", "header"),
        ...tracker,
        ...(hasEvent ? [step("hre-mission-list", "allMissions")] : []),
        ...side,
      ],
      mobile: [
        ...switcher,
        step("hre-status", "header"),
        ...tracker,
        ...side,
        ...(hasEvent ? [step("hre-all-missions-toggle", "allMissions")] : []),
      ],
    }
  }, [
    t,
    hasSwitcher,
    hasEvent,
    hasRaids,
    running,
    suggestionsTarget,
    hasTokens,
  ])

  useTourPageSteps(steps)
}
