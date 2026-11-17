import { useCallback } from "react"

import { useAnalyticsActions } from "@/shared/analytics"

import type { RaidGrouping } from "./raid-grouping"
import { useRaidGrouping } from "./use-raid-grouping"

/**
 * The grouping switch's value and its pick: remembers the new grouping on this browser and reports
 * `daily_raids_grouping_changed`, so the usage of each layout can be compared. Picking the current
 * grouping again does nothing.
 */
export function usePickRaidGrouping(): [
  RaidGrouping,
  (next: RaidGrouping) => void,
] {
  const [grouping, setGrouping] = useRaidGrouping()
  const { captureEvent } = useAnalyticsActions()
  const pick = useCallback(
    (next: RaidGrouping) => {
      if (next === grouping) return
      setGrouping(next)
      captureEvent({ type: "daily_raids_grouping_changed", grouping: next })
    },
    [grouping, setGrouping, captureEvent]
  )
  return [grouping, pick]
}
