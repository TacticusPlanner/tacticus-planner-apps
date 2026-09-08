import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey =
  | "purpose"
  | "track"
  | "mode"
  | "project"
  | "teamSize"
  | "preferences"
  | "plan"
  | "locks"
  | "regenerate"

/**
 * Joyride tour for the Dailies Salvage Run recommendations page: the page's purpose, the alliance
 * track selector, the XP/Power mode switch, the driving-project selector, the team-size control,
 * the preferred trait / damage type selects, the Plan Team, the Random Team's per-character locks,
 * and its Regenerate control. Desktop and mobile share the same targets.
 */
export function useSalvageRunTutorial() {
  const { t } = useTranslation("salvageRun")

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.salvageRun.steps.${key}.title`),
      content: t(`tour.salvageRun.steps.${key}.content`),
    })

    const shared: Step[] = [
      step("salvage-run-page", "purpose"),
      step("salvage-track-selector", "track"),
      step("salvage-mode-toggle", "mode"),
      step("salvage-project-select", "project"),
      step("salvage-team-size", "teamSize"),
      step("salvage-preferences", "preferences"),
      step("salvage-category-plan", "plan"),
      step("salvage-category-random", "locks"),
      step("salvage-random-regenerate", "regenerate"),
    ]

    return { desktop: shared, mobile: shared }
  }, [t])

  useTourPageSteps(steps)
}
