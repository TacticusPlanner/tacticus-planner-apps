import { createContext, useContext } from "react"

/** Which event signals are running, shared by `HseLiveProvider`; all false without a provider. */
export type EventLiveSignals = { hse: boolean; hre: boolean; quest: boolean }

export const HseLiveContext = createContext<EventLiveSignals>({
  hse: false,
  hre: false,
  quest: false,
})

export function useEventLiveSignals(): EventLiveSignals {
  return useContext(HseLiveContext)
}
