import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import type { TourPageSteps } from "@/shared/tour"

const TIER_LIST_TOUR_TARGETS = {
  // The Heroes / Enemies tabs: the intro step explains what the open list shows.
  intro: '[data-testid="tier-list-kind"]',
  row: '[data-testid="tier-list-row-S"]',
  tile: '[data-testid="tier-list-first-tile"]',
  // The desktop controls row, or the mobile Filters button: both carry this test id.
  filters: '[data-testid="tier-list-filters"]',
} as const

/** The Tier List's page tour on the Heroes tab: what the list means (the page help, on the tabs),
 *  the S row, its first tile, then the filters. Desktop and mobile share targets and order; only
 *  the placement differs. A step whose target is not rendered (the list is loading, absent, or the
 *  filters emptied it) is left out. */
export function useTierListTutorial({
  hasRow,
  hasTile,
  hasFilters,
}: {
  hasRow: boolean
  hasTile: boolean
  hasFilters: boolean
}): TourPageSteps {
  const { t } = useTranslation("legendaryEvents")
  return useMemo(() => {
    const step = (
      key: Exclude<keyof typeof TIER_LIST_TOUR_TARGETS, "intro">,
      placement: Step["placement"]
    ): Step => ({
      target: TIER_LIST_TOUR_TARGETS[key],
      placement,
      title: t(`tour.tierList.steps.${key}.title`),
      content: t(`tour.tierList.steps.${key}.content`),
    })
    const intro: Step = {
      target: TIER_LIST_TOUR_TARGETS.intro,
      placement: "bottom",
      title: t("npcTierList.kind.heroes"),
      content: `${t("tierList.intro")} ${t("tierList.explainer")}`,
    }
    const build = (placement: Step["placement"]) => [
      intro,
      ...(hasRow ? [step("row", "bottom")] : []),
      ...(hasTile ? [step("tile", placement)] : []),
      ...(hasFilters ? [step("filters", "bottom")] : []),
    ]
    return { desktop: build("right"), mobile: build("bottom") }
  }, [hasRow, hasTile, hasFilters, t])
}

const NPC_TIER_LIST_FILTERS_TARGET = '[data-testid="npc-tier-list-toolbar"]'

/** The Tier List's page tour on the Enemies tab: what the list means (on the tabs), then the
 *  search and event filter once the list is shown. */
export function useNpcTierListTutorial({
  hasFilters,
}: {
  hasFilters: boolean
}): TourPageSteps {
  const { t } = useTranslation("legendaryEvents")
  return useMemo(() => {
    const steps: Step[] = [
      {
        target: TIER_LIST_TOUR_TARGETS.intro,
        placement: "bottom",
        title: t("npcTierList.kind.enemies"),
        content: t("npcTierList.intro"),
      },
      ...(hasFilters
        ? [
            {
              target: NPC_TIER_LIST_FILTERS_TARGET,
              placement: "bottom" as const,
              title: t("tour.tierList.steps.filters.title"),
              content: t("tour.tierList.steps.npcFilters.content"),
            },
          ]
        : []),
    ]
    return { desktop: steps, mobile: steps }
  }, [hasFilters, t])
}
