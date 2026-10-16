import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { type TourPageSteps } from "@/shared/tour"

/**
 * Header and values control, the tabs, the Primary ability, then the Ability upgrades ranges and
 * totals while that tab is open, or a pointer at the tab otherwise. Desktop targets the panel; mobile
 * targets the collapsible section header.
 */
export function useMowUnitTutorial({
  upgradesOpen,
}: {
  upgradesOpen: boolean
}): TourPageSteps {
  const { t } = useTranslation("library")

  return useMemo<TourPageSteps>(() => {
    const step = (key: string, target: string, placement: Step["placement"]) =>
      ({
        target: `[data-testid="${target}"]`,
        title: t(`mowUnit.tour.steps.${key}.title`, { defaultValue: key }),
        content: t(`mowUnit.tour.steps.${key}.content`, { defaultValue: key }),
        placement,
      }) satisfies Step

    const upgrades = upgradesOpen
      ? [
          step("ranges", "mow-upgrades-ranges", "bottom"),
          step("totals", "mow-upgrades-totals", "top"),
        ]
      : [step("upgrades", "unit-tab-upgrades", "bottom")]
    const ability = (target: string) =>
      upgradesOpen ? [] : [step("ability", target, "top")]

    return {
      desktop: [
        step("header", "unit-header", "bottom"),
        step("tabs", "unit-tabs", "bottom"),
        ...ability("unit-ability-primary"),
        ...upgrades,
      ],
      mobile: [
        step("header", "unit-header", "bottom"),
        step("tabs", "unit-tabs", "bottom"),
        ...ability("unit-section-primary"),
        ...upgrades,
      ],
    }
  }, [upgradesOpen, t])
}
