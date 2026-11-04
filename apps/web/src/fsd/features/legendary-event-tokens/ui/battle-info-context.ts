import { createContext } from "react"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"

/** Opens the page's battle info dialog for one lane battle (0-based index). */
export type OpenBattleInfo = (
  laneId: LegendaryEventLaneId,
  battleIndex: number
) => void

/** The event page provides it; elsewhere (the plan wizard) battles render as plain text. */
export const BattleInfoContext = createContext<OpenBattleInfo | null>(null)
