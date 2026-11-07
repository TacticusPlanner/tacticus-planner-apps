import { useStoredOpen } from "./use-stored-open"

/** Where the Points / Missions order is remembered per device; the Next token card, the Token plan
 *  and the plan wizard share it. */
const ORDER_KEY = "legendaryEvents.tokenPlan.missionsOrder"

/** The shared Missions order switch state: true while the plan reads in Missions order. */
export function useMissionsOrder() {
  return useStoredOpen(ORDER_KEY, false)
}
