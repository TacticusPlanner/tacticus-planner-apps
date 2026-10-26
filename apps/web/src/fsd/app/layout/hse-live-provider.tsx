import { useMemo, type ReactNode } from "react"

import { useActiveHomeScreenEvent } from "@/features/daily-raids"
import { useIsHreLive } from "@/features/hre-missions"
import { useIsQuestLive } from "@/features/quest-event"

import { HseLiveContext } from "./hse-live-context"

/**
 * Runs the Home Screen Event, Hero Release Event and Quest Event queries once for the whole authenticated shell
 * and shares which one is running. Loading and error read as not live, so the indicator never
 * shows a false positive. Mounted only when signed in; without a provider the context is all false.
 */
export function HseLiveProvider({ children }: { children: ReactNode }) {
  const state = useActiveHomeScreenEvent()
  const hse = state.status === "ready" && state.active !== null
  const hre = useIsHreLive()
  const quest = useIsQuestLive()
  const value = useMemo(() => ({ hse, hre, quest }), [hse, hre, quest])

  return <HseLiveContext value={value}>{children}</HseLiveContext>
}
