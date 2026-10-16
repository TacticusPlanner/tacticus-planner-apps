import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { type TourPageSteps } from "@/shared/tour"

/**
 * Header and values control, the tabs, the active ability, the comparison, and the Rank-up tab.
 * Desktop targets the cards; mobile targets the collapsible section headers. The ability step is
 * left out when the unit has no ability text (its panel has no stepper or chart to explain).
 */
export function useCharacterUnitTutorial({
  hasAbilityText,
}: {
  hasAbilityText: boolean
}): TourPageSteps {
  const { t } = useTranslation("library")

  return useMemo<TourPageSteps>(() => {
    const step = (key: string, target: string, placement: Step["placement"]) =>
      ({
        target: `[data-testid="${target}"]`,
        title: t(`characterUnit.tour.steps.${key}.title`, {
          defaultValue: key,
        }),
        content: t(`characterUnit.tour.steps.${key}.content`, {
          defaultValue: key,
        }),
        placement,
      }) satisfies Step

    const desktop = [
      step("header", "unit-header", "bottom"),
      step("tabs", "unit-tabs", "bottom"),
      ...(hasAbilityText
        ? [step("ability", "unit-ability-active", "top")]
        : []),
      step("compare", "unit-compare", "top"),
      step("rankup", "unit-tab-rankup", "bottom"),
    ]
    const mobile = [
      step("header", "unit-header", "bottom"),
      step("tabs", "unit-tabs", "bottom"),
      ...(hasAbilityText
        ? [step("ability", "unit-section-active", "top")]
        : []),
      step("compare", "unit-section-compare", "top"),
      step("rankup", "unit-tab-rankup", "bottom"),
    ]
    return { desktop, mobile }
  }, [hasAbilityText, t])
}
