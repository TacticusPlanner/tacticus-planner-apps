import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey =
  "target" | "summary" | "teams" | "units" | "log" | "totals" | "wars"

/**
 * Joyride tours for the Guild War tabs. Offense covers the level, zone and rarity toolbar, the
 * summary, the offense teams (optional: a player may have none), the units and the attack log
 * (optional: empty until the first attack). History covers the totals and the past wars (both
 * optional: empty until a war has ended).
 */
export function useGuildWarTutorial(tab: "offense" | "history") {
  const { t } = useTranslation("guildWar")

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey, optional = false): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.${key}.title`),
      content: t(`tour.${key}.content`),
      ...(optional ? { data: { optional: true } } : {}),
    })
    const shared =
      tab === "offense"
        ? [
            step("guild-war-level-field", "target"),
            step("guild-war-summary", "summary"),
            step("guild-war-teams", "teams", true),
            step("guild-war-units", "units", true),
            step("guild-war-attack-log", "log", true),
          ]
        : [
            step("guild-war-totals", "totals", true),
            step("guild-war-past-wars", "wars", true),
          ]
    return { desktop: shared, mobile: shared }
  }, [t, tab])

  useTourPageSteps(steps)
}
