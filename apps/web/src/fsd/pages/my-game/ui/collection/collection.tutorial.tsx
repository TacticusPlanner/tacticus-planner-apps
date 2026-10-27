import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { type TourPageSteps } from "@/shared/tour"

type CollectionStepKey =
  "toolbar" | "quickFilters" | "summary" | "faction" | "owned" | "unowned"

/**
 * Walks the toolbar (search, sort and filters), the quick filters, the summary, the first faction
 * group, an owned tile and a greyed-out unowned tile. Both layouts share the same targets: on
 * mobile the toolbar target is the search and button rows, never the filter sheet, which is closed
 * during the tour. The summary is shown only once a roster has synced and some unit is listed, the
 * faction step only while a group is listed, an owned tile only when a listed unit is owned and an
 * unowned tile only while a listed unit is not, so those steps are left out otherwise rather than
 * pointing at nothing.
 */
export function useCollectionTutorial({
  hasSummary,
  hasGroups,
  hasOwned,
  hasUnowned,
}: {
  hasSummary: boolean
  hasGroups: boolean
  hasOwned: boolean
  hasUnowned: boolean
}): TourPageSteps {
  const { t } = useTranslation("common")

  return useMemo<TourPageSteps>(() => {
    const step = (
      key: CollectionStepKey,
      target: string,
      placement: Step["placement"]
    ) =>
      ({
        target: `[data-testid="${target}"]`,
        title: t(`tour.collection.steps.${key}.title`),
        content: t(`tour.collection.steps.${key}.content`),
        placement,
      }) satisfies Step
    const toolbar = [
      step("toolbar", "collection-toolbar", "bottom"),
      step("quickFilters", "collection-quick-filters", "bottom"),
    ]
    const summary = hasSummary
      ? [step("summary", "collection-summary", "bottom")]
      : []
    const faction = (placement: Step["placement"]) =>
      hasGroups ? [step("faction", "collection-faction-group", placement)] : []
    const owned = (placement: Step["placement"]) =>
      hasGroups && hasOwned
        ? [step("owned", "collection-owned-tile", placement)]
        : []
    const unowned = (placement: Step["placement"]) =>
      hasGroups && hasUnowned
        ? [step("unowned", "collection-unowned-tile", placement)]
        : []

    return {
      desktop: [
        ...toolbar,
        ...summary,
        ...faction("right"),
        ...owned("bottom"),
        ...unowned("bottom"),
      ],
      mobile: [
        ...toolbar,
        ...summary,
        ...faction("bottom"),
        ...owned("bottom"),
        ...unowned("top"),
      ],
    }
  }, [t, hasSummary, hasGroups, hasOwned, hasUnowned])
}
