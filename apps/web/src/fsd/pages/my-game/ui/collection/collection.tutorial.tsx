import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { type TourPageSteps } from "@/shared/tour"

type CollectionStepKey = "summary" | "faction" | "owned" | "unowned"

/**
 * Walks the summary, the first faction group, an owned tile and a greyed-out unowned tile. Both
 * layouts share the same targets (the page only reflows); only placement differs. The summary is
 * shown only once a roster has synced and an owned tile only when the player owns a unit, so those
 * steps are left out otherwise rather than pointing at nothing.
 */
export function useCollectionTutorial({
  hasSummary,
  hasOwned,
}: {
  hasSummary: boolean
  hasOwned: boolean
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
    const summary = hasSummary
      ? [step("summary", "collection-summary", "bottom")]
      : []
    const owned = (placement: Step["placement"]) =>
      hasOwned ? [step("owned", "collection-owned-tile", placement)] : []

    return {
      desktop: [
        ...summary,
        step("faction", "collection-faction-group", "right"),
        ...owned("bottom"),
        step("unowned", "collection-unowned-tile", "bottom"),
      ],
      mobile: [
        ...summary,
        step("faction", "collection-faction-group", "bottom"),
        ...owned("bottom"),
        step("unowned", "collection-unowned-tile", "top"),
      ],
    }
  }, [t, hasSummary, hasOwned])
}
