import { createContext, useContext } from "react"

/** Where a View control is drawn: inline in the toolbar row, or stacked in the mobile View sheet. */
export type ViewPlacement = "bar" | "sheet"

export const ViewPlacementContext = createContext<ViewPlacement>("bar")

/** Lets a View-slot control lay itself out for the toolbar row or the mobile View sheet. */
export function useViewPlacement(): ViewPlacement {
  return useContext(ViewPlacementContext)
}
