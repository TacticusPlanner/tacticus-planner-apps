import { createContext, useContext } from "react"
import type { ComponentType, ReactNode } from "react"

import type { DailyRaidsReadyViewModel } from "./daily-raids.domain"
import type { MaterialLockedNode } from "./material-details"

/** Renders its children with the locked nodes that drop a resource, closest first (Goals' unlock
 *  paths): a component, so the popover reads that data only while it is open. */
type LockedNodesComponent = ComponentType<{
  resourceId: string
  children: (nodes: readonly MaterialLockedNode[]) => ReactNode
}>

/** What a material icon needs to open its details: the plan run, and how far away each locked
 *  node is. */
export type MaterialDetailsSource = {
  raids: DailyRaidsReadyViewModel
  LockedNodes?: LockedNodesComponent
}

export const MaterialDetailsContext =
  createContext<MaterialDetailsSource | null>(null)

/** The surrounding page's plan run, or null where a material icon only names its material. */
export function useMaterialDetailsSource(): MaterialDetailsSource | null {
  return useContext(MaterialDetailsContext)
}
