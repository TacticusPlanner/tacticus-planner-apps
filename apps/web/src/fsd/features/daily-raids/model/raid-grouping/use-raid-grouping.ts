import { storedPreference, useStoredPreference } from "@/shared/lib"

import { DEFAULT_RAID_GROUPING, isRaidGrouping } from "./raid-grouping"
import type { RaidGrouping } from "./raid-grouping"

/** Where this browser remembers the grouping picked on Dailies > Raids. */
const RAID_GROUPING = storedPreference("dailies", "raidGrouping")

const parseRaidGrouping = (stored: unknown): RaidGrouping =>
  isRaidGrouping(stored) ? stored : DEFAULT_RAID_GROUPING

/**
 * The raid list grouping, remembered per browser (spec: daily-raids-today, "Raid grouping"). Picked
 * on Dailies > Raids only; every raid list reads it, so they all follow the one choice.
 */
export function useRaidGrouping(): [
  RaidGrouping,
  (next: RaidGrouping) => void,
] {
  return useStoredPreference(RAID_GROUPING, parseRaidGrouping)
}
