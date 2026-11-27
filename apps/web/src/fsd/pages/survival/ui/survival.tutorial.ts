import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

import type { SurvivalTab } from "../model/survival-tabs"

type StepKey =
  | "event"
  | "line"
  | "howItWorks"
  | "tabs"
  | "lineup"
  | "goals"
  | "waves"
  | "milestones"
  | "chests"
  | "points"
  | "missions"
  | "offers"

/**
 * The Survival page's tour: the event switcher, the event line, "How this event works" and the tabs,
 * then the shown tab's own parts. Steps on parts a tab may not show (no team yet, no offers) are
 * optional.
 */
export function useSurvivalTutorial(tab: SurvivalTab) {
  const { t } = useTranslation("survival")

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey, optional = false): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.${key}.title`),
      content: t(`tour.${key}.content`),
      ...(optional ? { data: { optional: true } } : {}),
    })
    const shared = [
      step("survival-event-switcher", "event"),
      step("survival-event-line", "line"),
      step("survival-how-it-works", "howItWorks"),
      step("survival-tab-team", "tabs"),
    ]
    const byTab: Record<SurvivalTab, Step[]> = {
      team: [
        step("survival-lineup", "lineup"),
        step("survival-goals", "goals", true),
      ],
      enemies: [step("survival-waves", "waves")],
      rewards: [
        step("survival-milestones", "milestones"),
        step("survival-chests", "chests"),
        step("survival-points", "points"),
      ],
      missions: [step("survival-missions", "missions")],
      offers: [step("survival-offers", "offers", true)],
    }
    const all = [...shared, ...byTab[tab]]
    return { desktop: all, mobile: all }
  }, [t, tab])

  useTourPageSteps(steps)
}
