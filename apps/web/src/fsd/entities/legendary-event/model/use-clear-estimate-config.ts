import { useMemo } from "react"
import { getLegendaryEventClearEstimate } from "@workspace/game-catalog/queries"

import {
  clearEstimateConfig,
  type ClearEstimateConfig,
} from "../lib/clear-estimate"
import { useReadState } from "./use-read-state"

/** The `lre-clear-estimate` dataset's state (design D6): `absent` when the catalog has no record
 *  (estimates are then hidden everywhere), `failed` when the read failed. */
export type ClearEstimateConfigState =
  | { status: "loading" }
  | { status: "absent" }
  | { status: "failed"; retry: () => void }
  | { status: "ready"; config: ClearEstimateConfig }

/** The config, stable across renders while the record is unchanged (it is a memo input). */
export function useClearEstimateConfig(): ClearEstimateConfigState {
  const read = useReadState(() => getLegendaryEventClearEstimate(), [])
  const record = read.status === "ready" ? read.data : undefined
  const { status, retry } = read
  return useMemo((): ClearEstimateConfigState => {
    if (status === "loading") return { status: "loading" }
    if (status === "error") return { status: "failed", retry }
    if (!record) return { status: "absent" }
    return { status: "ready", config: clearEstimateConfig(record) }
  }, [status, retry, record])
}
