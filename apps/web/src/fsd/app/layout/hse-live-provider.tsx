import type { ReactNode } from "react"

import { useActiveHomeScreenEvent } from "@/features/daily-raids"

import { HseLiveContext } from "./hse-live-context"

/**
 * Runs the Home Screen Event query once for the whole authenticated shell and shares one boolean:
 * "an HSE is running". Loading and error read as not live, so the indicator never shows a false
 * positive. Mounted only when signed in; without a provider the context is simply false.
 */
export function HseLiveProvider({ children }: { children: ReactNode }) {
  const state = useActiveHomeScreenEvent()
  const isLive = state.status === "ready" && state.active !== null

  return <HseLiveContext value={isLive}>{children}</HseLiveContext>
}
