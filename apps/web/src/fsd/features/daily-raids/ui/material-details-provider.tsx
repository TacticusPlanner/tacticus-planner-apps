import type { ReactNode } from "react"

import type { DailyRaidsViewModel } from "../model/daily-raids.domain"
import { MaterialDetailsContext } from "../model/material-details-context"
import type { MaterialDetailsSource } from "../model/material-details-context"

/** Lets every material icon inside open its details popover from this plan run, once it is ready;
 *  until then the icons only name their material. */
export function MaterialDetailsProvider({
  raids,
  LockedNodes,
  children,
}: {
  raids: DailyRaidsViewModel
  /** Adds each locked node's distance (Goals' `LockedNodesOf`). */
  LockedNodes?: MaterialDetailsSource["LockedNodes"]
  children: ReactNode
}) {
  return (
    <MaterialDetailsContext.Provider
      value={raids.status === "ready" ? { raids, LockedNodes } : null}
    >
      {children}
    </MaterialDetailsContext.Provider>
  )
}
