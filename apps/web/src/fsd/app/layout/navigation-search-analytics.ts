import { useEffect, useEffectEvent, useRef } from "react"

import { useAnalyticsActions } from "@/shared/analytics"
import type { AnalyticsEvent } from "@/shared/analytics"

import type { NavigationEntry, NavigationGroup } from "./navigation-search"
import type { QuickActionId, QuickSelection } from "./quick-actions"

type SelectedEvent = Extract<
  AnalyticsEvent,
  { type: "navigation_search_item_selected" }
>
export type NavigationSearchSource = Extract<
  AnalyticsEvent,
  { type: "navigation_search_opened" }
>["source"]
type ViewMode = SelectedEvent["viewMode"]

/** A picked row or chip, as reported: what it is, where it was, never what was typed. */
export type NavigationPick = Pick<
  SelectedEvent,
  "itemKind" | "target" | "group" | "position"
>

/** What a list row is and points at: a page's nav path, an action id or an entity's game id. Find in
 *  Collection reports no target, since its link carries the query. */
function describeEntry(
  entry: NavigationEntry,
  group: NavigationGroup["id"]
): Pick<NavigationPick, "itemKind" | "target"> {
  switch (entry.kind) {
    case "action": {
      return { itemKind: "action", target: entry.action.id }
    }
    case "section":
    case "child": {
      return {
        itemKind: group === "recent" ? "recentPage" : "page",
        target: entry.item.path,
      }
    }
    case "entity": {
      return { itemKind: entry.entity.kind, target: entry.entity.id }
    }
    case "unitGoal": {
      return { itemKind: "unitGoal", target: entry.unit.id }
    }
    case "collectionSearch": {
      return { itemKind: "collectionSearch", target: "" }
    }
  }
}

/** The pick for a list row: its kind and target, its group, and its 1-based place in the list. */
export function listPick(
  groups: readonly NavigationGroup[],
  entry: NavigationEntry
): NavigationPick {
  const rows = groups.flatMap((group) =>
    group.entries.map((row) => ({ row, group: group.id }))
  )
  const index = rows.findIndex(({ row }) => row.key === entry.key)
  const group = rows[index]?.group ?? "pages"
  return { ...describeEntry(entry, group), group, position: index + 1 }
}

/** The pick for a phone Menu chip: the chip row lists the open unit's Create goal first, then
 *  `chipIds` in order. */
export function chipPick(
  selection: QuickSelection,
  chipIds: readonly QuickActionId[],
  hasUnitChip: boolean
): NavigationPick {
  if (typeof selection === "object") {
    return {
      itemKind: "unitGoal",
      target: selection.createGoalFor.entityId,
      group: "chips",
      position: 1,
    }
  }
  return {
    itemKind: "action",
    target: selection,
    group: "chips",
    position: chipIds.indexOf(selection) + 1 + (hasUnitChip ? 1 : 0),
  }
}

/** How many rows the list shows. */
export function listRowCount(groups: readonly NavigationGroup[]): number {
  return groups.reduce((count, group) => count + group.entries.length, 0)
}

/**
 * Reports navigation search use (spec: product-analytics): `navigation_search_opened` when the
 * palette mounts (it mounts on each opening), `navigation_search_item_selected` for each pick, and
 * `navigation_search_dismissed` when it unmounts without one. Only the query's length is sent.
 * `selectMethod` notes whether the next pick comes from the keyboard or the pointer.
 */
export function useNavigationSearchTracking({
  openedVia,
  queryLength,
  resultCount,
  viewMode,
}: {
  openedVia: NavigationSearchSource
  queryLength: number
  resultCount: number
  viewMode: ViewMode
}) {
  const { captureEvent } = useAnalyticsActions()
  const picked = useRef(false)
  const method = useRef<SelectedEvent["method"]>("pointer")

  // Read when they fire, so a query change or the SDK loading mid-search never reopens the session.
  const reportOpened = useEffectEvent(() => {
    captureEvent({
      type: "navigation_search_opened",
      source: openedVia,
      viewMode,
    })
  })
  const reportDismissed = useEffectEvent(() => {
    if (picked.current) return
    captureEvent({
      type: "navigation_search_dismissed",
      queryLength,
      resultCount,
      viewMode,
    })
  })
  useEffect(() => {
    reportOpened()
    return () => reportDismissed()
  }, [])

  const reportPick = (pick: NavigationPick) => {
    picked.current = true
    captureEvent({
      type: "navigation_search_item_selected",
      ...pick,
      queryLength,
      method: method.current,
      viewMode,
    })
  }

  const selectMethod = (next: SelectedEvent["method"]) => {
    method.current = next
  }

  return { reportPick, selectMethod }
}
