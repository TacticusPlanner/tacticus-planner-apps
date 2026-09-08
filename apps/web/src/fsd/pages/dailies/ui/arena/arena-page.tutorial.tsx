import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey = "purpose" | "mode" | "category" | "variants" | "regenerate"

/**
 * Joyride tour for the Dailies Arena recommendations page: the page's purpose, the XP/Power mode
 * switch, a recommended-team category, the team-size switcher, and the Random team's Regenerate
 * control. Desktop and mobile share the same targets (both layouts carry the same `data-testid`s).
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
      step("arena-category-active-project", "category"),
      step("arena-variant-switcher", "variants"),
      step("arena-random-regenerate", "regenerate"),
    ]

    return { desktop: shared, mobile: shared }
  }, [t])

  useTourPageSteps(steps)
}
