import { createContext, useContext } from "react"

/** "A Home Screen Event is running", shared by `HseLiveProvider`; false without a provider. */
export const HseLiveContext = createContext(false)

export function useIsHseLive(): boolean {
  return useContext(HseLiveContext)
}
