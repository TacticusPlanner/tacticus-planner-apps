import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps, type TourPageSteps } from "@/shared/tour"

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

    return {
      desktop: [
        step("guild-raids-desktop-shell", "purpose"),
        step("guild-raids-access-shell", "access"),
        step("guild-raid-status-section", "status"),
        step("guild-raid-resources-card", "resources"),
        ...(hasActiveBoss
          ? [step("guild-raid-exact-meta-section", "exactMetaDesktop")]
          : []),
      ],
      mobile: [
        step("guild-raids-mobile-shell", "purpose"),
        step("guild-raids-access-shell", "access"),
        step("guild-raid-status-section", "status"),
        step("guild-raid-resources-card", "resources"),
        ...(hasActiveBoss
          ? [step("guild-raid-exact-meta-section", "exactMetaMobile")]
          : []),
      ],
    }
  }, [t, hasActiveBoss])

  useTourPageSteps(steps)
}
