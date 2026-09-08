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
  | "shardRecipient"
  | "locks"
  | "regenerate"

/**
 * Joyride tour for the Dailies Onslaught recommendations page: the page's purpose, the alliance
 * track selector, the XP/Power mode switch, the driving-project selector, the team-size control,
 * the preferred trait / damage type selects, the Plan Team, the post-battle shard recipient panel,
 * the Random Team's per-character locks, and its Regenerate control. Desktop and mobile share the
 * same targets.
 */
export function useOnslaughtTutorial() {
  const { t } = useTranslation("onslaught")

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.onslaught.steps.${key}.title`),
      content: t(`tour.onslaught.steps.${key}.content`),
    })

    const shared: Step[] = [
      step("onslaught-page", "purpose"),
      step("onslaught-track-selector", "track"),
      step("onslaught-mode-toggle", "mode"),
      step("onslaught-project-select", "project"),
      step("onslaught-team-size", "teamSize"),
      step("onslaught-preferences", "preferences"),
      step("onslaught-category-plan", "plan"),
      step("onslaught-shard-recipient", "shardRecipient"),
      step("onslaught-category-random", "locks"),
      step("onslaught-random-regenerate", "regenerate"),
    ]

    return { desktop: shared, mobile: shared }
  }, [t])

  useTourPageSteps(steps)
}
