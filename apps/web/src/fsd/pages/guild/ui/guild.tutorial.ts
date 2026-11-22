import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey = "summary" | "actions" | "members" | "apiKey"

/**
 * Joyride tours for the Guild tabs. Both start with the guild summary and the Sync / Delete actions
 * (an optional step: only a Leader or Co-Leader sees them). Members then covers the member table on
 * desktop or the member cards on mobile (optional: neither renders for an empty guild); Settings
 * covers the Guild API key card.
 */
export function useGuildTutorial(tab: "members" | "settings") {
  const { t } = useTranslation()

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey, optional = false): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.guild.steps.${key}.title`),
      content: t(`tour.guild.steps.${key}.content`),
      ...(optional ? { data: { optional: true } } : {}),
    })
    const lead = [
      step("guild-summary", "summary"),
      step("guild-toolbar", "actions", true),
    ]
    if (tab === "settings") {
      const shared = [...lead, step("guild-settings", "apiKey")]
      return { desktop: shared, mobile: shared }
    }
    return {
      desktop: [...lead, step("guild-members-table", "members", true)],
      mobile: [...lead, step("guild-members-cards", "members", true)],
    }
  }, [t, tab])

  useTourPageSteps(steps)
}
