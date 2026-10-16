import { useMemo } from "react"

import type { LegendaryEventLifecycle } from "@/entities/legendary-event"

import {
  buildTokenPlanView,
  type TokenPlanView,
  type TokenPlanViewInput,
} from "../lib/token-plan-view"

/**
 * The token plan, next token, supply and forecast, recomputed only when a read they use changes
 * (synced progress, the plan's teams, depths, marks and inputs, the clear estimates, the clock).
 * Loading until the event and its lifecycle are known, so the page can call it before its guards.
 */
export function useTokenPlan({
  event,
  lifecycle,
  nowMs,
  progress,
  progressObservedAtMs,
  plan,
  run,
  estimates,
}: Omit<TokenPlanViewInput, "event" | "lifecycle"> & {
  event: TokenPlanViewInput["event"] | undefined
  lifecycle: LegendaryEventLifecycle | undefined
}): TokenPlanView {
  const { enabled, status, data } = plan
  // The page derives the lifecycle on every render; key it on its values so the plan is not redone.
  const state = lifecycle?.state
  const runStartMs = lifecycle?.runStartMs
  const runEndMs = lifecycle?.runEndMs
  const stableLifecycle = useMemo(
    () =>
      state === undefined
        ? undefined
        : ({ state, runStartMs, runEndMs } as LegendaryEventLifecycle),
    [state, runStartMs, runEndMs]
  )
  return useMemo(
    () =>
      event && stableLifecycle
        ? buildTokenPlanView({
            event,
            lifecycle: stableLifecycle,
            nowMs,
            progress,
            progressObservedAtMs,
            plan: { enabled, status, data },
            run,
            estimates,
          })
        : { kind: "loading" },
    [
      event,
      stableLifecycle,
      nowMs,
      progress,
      progressObservedAtMs,
      enabled,
      status,
      data,
      run,
      estimates,
    ]
  )
}
