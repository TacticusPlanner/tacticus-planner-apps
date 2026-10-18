import { useMemo } from "react"

import type {
  LegendaryEvent,
  LegendaryEventPlan,
  LegendaryEventRun,
  LegendaryEventUnit,
} from "@/entities/legendary-event"

import {
  buildLanePotentials,
  type LanePotentialsViewModel,
} from "./lane-potential.view-model"
import type {
  ClearEstimatesViewModel,
  ProgressGridViewModel,
} from "./legendary-event-page.view-model"

const ALL_LOADING: LanePotentialsViewModel = {
  alpha: { kind: "loading" },
  beta: { kind: "loading" },
  gamma: { kind: "loading" },
}

/** The page's lane potentials, memoised on its reads; every lane loads until the event is known. */
export function useLanePotentials(
  event: LegendaryEvent | undefined,
  units: readonly LegendaryEventUnit[] | "loading" | "error",
  progressGrid: ProgressGridViewModel,
  {
    clearEstimates,
    plan,
    run,
  }: {
    clearEstimates: ClearEstimatesViewModel
    plan: LegendaryEventPlan | undefined
    run: LegendaryEventRun
  }
): LanePotentialsViewModel {
  return useMemo(
    () =>
      event
        ? buildLanePotentials({
            event,
            units,
            progressGrid,
            clearEstimates,
            plan,
            run,
          })
        : ALL_LOADING,
    [event, units, progressGrid, clearEstimates, plan, run]
  )
}
