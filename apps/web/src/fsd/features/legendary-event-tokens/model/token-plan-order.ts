import { storedPreference, useStoredFlag } from "@/shared/lib"

/** Where the Points / Missions order is remembered per device; the Next token card, the Token plan
 *  and the plan wizard share it. */
const MISSIONS_ORDER = storedPreference("legendaryEvents", "missionsOrder")

/** The shared Missions order switch state: true while the plan reads in Missions order. */
export function useMissionsOrder() {
  return useStoredFlag(MISSIONS_ORDER, false)
}
