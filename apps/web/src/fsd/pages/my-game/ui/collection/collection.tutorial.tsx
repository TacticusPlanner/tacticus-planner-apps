import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { type TourPageSteps } from "@/shared/tour"

import type { CollectionLayout } from "../../model/collection-query"

type CollectionStepKey =
  | "compare"
  | "takeSnapshot"
  | "compareOptions"
  | "compareSummary"
  | "toolbar"
  | "view"
  | "quickFilters"
  | "summary"
  | "selectUnits"
  | "faction"
  | "factionRoster"
  | "owned"
  | "ownedRoster"
  | "ownedRosterMobile"
  | "unowned"
  | "unownedRoster"
  | "unownedRosterMobile"

/**
 * Walks the toolbar (search, sort and filters), the view switch with the Unowned toggle, the quick
 * filters, the summary, the first faction group (left out while units are not grouped by faction),
 * an owned unit and a greyed-out unowned unit. The
 * faction and unit steps point at the view shown: a card and tiles in Cards, a section and rows in
 * Roster, where the mobile text says a row expands before it opens. On mobile the toolbar target is
 * the search and button rows, never the filter sheet, which is closed during the tour. The summary
 * is shown only once a roster has synced and some unit is listed, the faction step only while a
 * group is listed, an owned unit only when a listed unit is owned and an unowned unit only while a
 * listed unit is not, so those steps are left out otherwise rather than pointing at nothing.
 * Signed in, the Compare switch and Take snapshot follow the toolbar (they sit between it and the
 * list); while compare mode shows a comparison it adds its summary, and on mobile its Compare
 * options trigger (the options sit inline on desktop, so that step is mobile-only).
 */
export function useCollectionTutorial({
  view = "cards",
  grouped = true,
  hasSummary,
  hasGroups,
  hasOwned,
  hasUnowned,
  hasSnapshotActions = false,
  compareReady = false,
  hasSelectToggle = false,
}: {
  view?: CollectionLayout
  /** Faction grouping on; without it there is no faction group to point at. */
  grouped?: boolean
  hasSummary: boolean
  hasGroups: boolean
  hasOwned: boolean
  hasUnowned: boolean
  /** Signed in: the Compare switch and Take snapshot are shown. */
  hasSnapshotActions?: boolean
  /** Compare mode shows a comparison (its summary and options are on the page). */
  compareReady?: boolean
  /** Signed in with a listed roster: the Select units toggle is beside the summary. */
  hasSelectToggle?: boolean
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
    const roster = view === "roster"
    const toolbar = [
      step("toolbar", "collection-toolbar", "bottom"),
      step("view", "collection-view-switch", "bottom"),
      step("quickFilters", "collection-quick-filters", "bottom"),
    ]
    const summary = hasSummary
      ? [
          step("summary", "collection-summary", "bottom"),
          ...(hasSelectToggle
            ? [step("selectUnits", "collection-select-toggle", "bottom")]
            : []),
        ]
      : []
    const faction = (placement: Step["placement"]) =>
      hasGroups && grouped
        ? [
            roster
              ? step("factionRoster", "collection-roster-section", placement)
              : step("faction", "collection-faction-group", placement),
          ]
        : []
    const unit = (
      state: "owned" | "unowned",
      shown: boolean,
      mobile: boolean,
      placement: Step["placement"]
    ) => {
      if (!hasGroups || !shown) return []
      const key: CollectionStepKey = roster
        ? mobile
          ? `${state}RosterMobile`
          : `${state}Roster`
        : state
      const target = `collection-${state}-${roster ? "row" : "tile"}`
      return [step(key, target, placement)]
    }

    const snapshotActions = hasSnapshotActions
      ? [
          step("compare", "compare-toggle", "bottom"),
          step("takeSnapshot", "take-snapshot", "bottom"),
        ]
      : []
    const compareSummary = compareReady
      ? [step("compareSummary", "compare-summary", "bottom")]
      : []
    const compareOptions = compareReady
      ? [step("compareOptions", "compare-options", "bottom")]
      : []

    return {
      desktop: [
        ...toolbar,
        ...snapshotActions,
        ...compareSummary,
        ...summary,
        ...faction("right"),
        ...unit("owned", hasOwned, false, "bottom"),
        ...unit("unowned", hasUnowned, false, "bottom"),
      ],
      mobile: [
        ...toolbar,
        ...snapshotActions,
        ...compareOptions,
        ...compareSummary,
        ...summary,
        ...faction("bottom"),
        ...unit("owned", hasOwned, true, "bottom"),
        ...unit("unowned", hasUnowned, true, "top"),
      ],
    }
  }, [
    t,
    view,
    grouped,
    hasSummary,
    hasGroups,
    hasOwned,
    hasUnowned,
    hasSnapshotActions,
    compareReady,
    hasSelectToggle,
  ])
}
