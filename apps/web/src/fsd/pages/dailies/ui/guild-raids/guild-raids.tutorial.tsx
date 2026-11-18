import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"
import type { TourPageSteps } from "@/shared/tour"

/** `hasActiveBoss` gates the exact-Meta step: its target only exists once a boss is active, and
 * react-joyride has no built-in recovery from a step whose target never appears. */
export function useGuildRaidsTutorial(hasActiveBoss: boolean) {
  const { t } = useTranslation("dailies")

  const steps = useMemo<TourPageSteps>(() => {
    const step = (
      target: string,
      key:
        | "purpose"
        | "access"
        | "status"
        | "resources"
        | "exactMetaDesktop"
        | "exactMetaMobile"
    ): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.guildRaids.steps.${key}.title`),
      content: t(`tour.guildRaids.steps.${key}.content`),
    })

    // How readiness is scored: page help, so it lives in the tour rather than behind an "i" button.
    const scoring: Step = {
      target: '[data-testid="guild-raid-exact-meta-section"]',
      title: t("guildRaids.exactMeta.howScored"),
      content: `${t("guildRaids.exactMeta.howScoredPicks")} ${t("guildRaids.exactMeta.howScoredReadiness")}`,
    }

    return {
      desktop: [
        step("guild-raids-desktop-shell", "purpose"),
        step("guild-raids-access-shell", "access"),
        step("guild-raid-status-section", "status"),
        step("guild-raid-resources-card", "resources"),
        ...(hasActiveBoss
          ? [step("guild-raid-exact-meta-section", "exactMetaDesktop"), scoring]
          : []),
      ],
      mobile: [
        step("guild-raids-mobile-shell", "purpose"),
        step("guild-raids-access-shell", "access"),
        step("guild-raid-status-section", "status"),
        step("guild-raid-resources-card", "resources"),
        ...(hasActiveBoss
          ? [step("guild-raid-exact-meta-section", "exactMetaMobile"), scoring]
          : []),
      ],
    }
  }, [t, hasActiveBoss])

  useTourPageSteps(steps)
}
