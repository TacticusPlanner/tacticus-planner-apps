import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps, type TourPageSteps } from "@/shared/tour"

export function useGuildRaidsTutorial() {
  const { t } = useTranslation("dailies")

  const steps = useMemo<TourPageSteps>(() => {
    const step = (
      target: string,
      key: "purpose" | "access" | "status" | "resources"
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
      ],
      mobile: [
        step("guild-raids-mobile-shell", "purpose"),
        step("guild-raids-access-shell", "access"),
        step("guild-raid-status-section", "status"),
        step("guild-raid-resources-card", "resources"),
      ],
    }
  }, [t])

  useTourPageSteps(steps)
}
