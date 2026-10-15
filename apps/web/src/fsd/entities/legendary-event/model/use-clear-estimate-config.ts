import { useMemo } from "react"
import {
  getHordeModeTiers,
  getLegendaryEventClearEstimate,
} from "@workspace/game-catalog/queries"

import {
  clearEstimateConfig,
  type ClearEstimateConfig,
} from "../lib/clear-estimate"
import { useReadState } from "./use-read-state"

/** The clear-estimate config's state (design D6): `absent` when the catalog has no
 *  `legendary-event-clear-estimate` record (estimates are then hidden everywhere), `failed` when a
 *  read failed. A missing `horde-mode-tiers` record leaves every character untiered. */
export type ClearEstimateConfigState =
  | { status: "loading" }
  | { status: "absent" }
  | { status: "failed"; retry: () => void }
  | { status: "ready"; config: ClearEstimateConfig }

async function readClearEstimateRecords() {
  const [estimate, hordeModeTiers] = await Promise.all([
    getLegendaryEventClearEstimate(),
    getHordeModeTiers(),
  ])
  return { estimate, hordeModeTiers }
}

/** The config, stable across renders while the records are unchanged (it is a memo input). */
export function useClearEstimateConfig(): ClearEstimateConfigState {
  const read = useReadState(readClearEstimateRecords, [])
  const estimate = read.status === "ready" ? read.data.estimate : undefined
  const hordeModeTiers =
    read.status === "ready" ? read.data.hordeModeTiers : undefined
  const { status, retry } = read
  return useMemo((): ClearEstimateConfigState => {
    if (status === "loading") return { status: "loading" }
    if (status === "error") return { status: "failed", retry }
    if (!estimate) return { status: "absent" }
    return {
      status: "ready",
      config: clearEstimateConfig(estimate, hordeModeTiers ?? null),
    }
  }, [status, retry, estimate, hordeModeTiers])
}
