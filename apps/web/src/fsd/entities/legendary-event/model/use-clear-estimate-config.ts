import { useMemo } from "react"
import { getHordeModeTiers } from "@workspace/game-catalog/queries"

import { useUnitPowerContext } from "@/shared/unit-power"

import {
  clearEstimateConfig,
  type ClearEstimateConfig,
} from "../lib/clear-estimate"
import { useReadState } from "./use-read-state"

/** The clear-estimate config's state (design D6): `failed` when the tier-list or the power-data
 *  read failed. A missing `horde-mode-tiers` record leaves every character untiered (estimates still
 *  show); a missing `unit-power` record leaves `config.unitPower` null (no estimate shows). */
export type ClearEstimateConfigState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "ready"; config: ClearEstimateConfig }

/** The config, ready once both the tier list and the power context are read, and stable across
 *  renders while they are unchanged (it is a memo input). */
export function useClearEstimateConfig(): ClearEstimateConfigState {
  const tiersRead = useReadState(getHordeModeTiers, [])
  const powerRead = useUnitPowerContext()
  const hordeModeTiers =
    tiersRead.status === "ready" ? tiersRead.data : undefined
  const unitPower = powerRead.status === "ready" ? powerRead.data : undefined
  const tiersStatus = tiersRead.status
  const powerStatus = powerRead.status
  const retryTiers = tiersRead.retry
  const retryPower = powerRead.retry
  return useMemo((): ClearEstimateConfigState => {
    if (tiersStatus === "error" || powerStatus === "error") {
      return {
        status: "failed",
        retry: () => {
          if (tiersStatus === "error") retryTiers()
          if (powerStatus === "error") retryPower()
        },
      }
    }
    if (tiersStatus === "loading" || powerStatus === "loading") {
      return { status: "loading" }
    }
    return {
      status: "ready",
      config: clearEstimateConfig(hordeModeTiers ?? null, unitPower ?? null),
    }
  }, [
    tiersStatus,
    powerStatus,
    retryTiers,
    retryPower,
    hordeModeTiers,
    unitPower,
  ])
}
