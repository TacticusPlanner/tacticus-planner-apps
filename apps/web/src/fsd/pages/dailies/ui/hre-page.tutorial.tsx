import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps, type TourPageSteps } from "@/shared/tour"

type StepKey =
  | "header"
  | "tracker"
  | "allMissions"
  | "raids"
  | "team"
  | "tokens"
  | "pace"
  | "paceSummary"

/**
 * Joyride tour for Dailies > HRE: the event header, then (with an event) the current mission,
 * the campaign raids, the mission team, the tokens needed and the pace on a running event, and the
 * mission list. Mobile points its pace step at the summary under the tracker (design D4), desktop
 * at the card. The `has*` flags gate steps whose targets are not rendered, since react-joyride
 * cannot recover from a target that never appears. Desktop points at the mission list; mobile at
 * its "All missions" toggle, last, as the page orders it.
 */
export function useHreTutorial({
  hasEvent,
  running,
  hasTeam,
  hasTokens,
}: {
  hasEvent: boolean
  running: boolean
  hasTeam: boolean
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
    const sections = hasEvent
      ? [
          step("hre-raids", "raids"),
          ...live([
            ...(hasTeam ? [step("hre-team", "team")] : []),
            ...(hasTokens ? [step("hre-tokens", "tokens")] : []),
          ]),
        ]
      : []

    return {
      desktop: [
        step("hre-status", "header"),
        ...live([step("hre-tracker", "tracker")]),
        ...(hasEvent ? [step("hre-mission-list", "allMissions")] : []),
        ...sections,
        ...live([step("hre-pace", "pace")]),
      ],
      mobile: [
        step("hre-status", "header"),
        ...live([
          step("hre-tracker", "tracker"),
          step("hre-pace-summary", "paceSummary"),
        ]),
        ...sections,
        ...(hasEvent ? [step("hre-all-missions-toggle", "allMissions")] : []),
      ],
    }
  }, [t, hasEvent, running, hasTeam, hasTokens])

  useTourPageSteps(steps)
}
