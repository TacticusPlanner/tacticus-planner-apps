import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey =
  | "purpose"
  | "mode"
  | "project"
  | "teamSize"
  | "preferences"
  | "plan"
  | "locks"
  | "regenerate"

/**
 * Joyride tour for the Dailies Arena recommendations page: the page's purpose, the XP/Power mode
 * switch, the driving-project selector, the team-size control, the preferred trait / damage type
 * selects, the Plan Team, the Random Team's per-character locks, and its Regenerate control.
 * Desktop and mobile share the same targets (both layouts carry the same `data-testid`s).
 */
export function useArenaTutorial() {
  const { t } = useTranslation("arena")

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.arena.steps.${key}.title`),
      content: t(`tour.arena.steps.${key}.content`),
    })

    const shared: Step[] = [
      step("arena-page", "purpose"),
      step("arena-mode-toggle", "mode"),
      step("arena-project-select", "project"),
      step("arena-team-size", "teamSize"),
      step("arena-preferences", "preferences"),
      step("arena-category-plan", "plan"),
      step("arena-category-random", "locks"),
      step("arena-random-regenerate", "regenerate"),
    ]

    return { desktop: shared, mobile: shared }
  }, [t])

  useTourPageSteps(steps)
}
