import { useMemo } from "react"
import { getHordeModeTiers } from "@workspace/game-catalog/queries"

import {
  clearEstimateConfig,
  type ClearEstimateConfig,
} from "../lib/clear-estimate"
import { useReadState } from "./use-read-state"

/** The clear-estimate config's state (design D6): `failed` when the tier-list read failed. A missing
 *  `horde-mode-tiers` record leaves every character untiered (estimates still show). */
export type ClearEstimateConfigState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "ready"; config: ClearEstimateConfig }

/** The config, stable across renders while the tier list is unchanged (it is a memo input). */
export function useClearEstimateConfig(): ClearEstimateConfigState {
  const read = useReadState(getHordeModeTiers, [])
  const hordeModeTiers = read.status === "ready" ? read.data : undefined
  const { status, retry } = read
  return useMemo((): ClearEstimateConfigState => {
    if (status === "loading") return { status: "loading" }
    if (status === "error") return { status: "failed", retry }
    return {
      status: "ready",
      config: clearEstimateConfig(hordeModeTiers ?? null),
    }
  }, [status, retry, hordeModeTiers])
}
