import { useCallback, useMemo, useState, type ReactNode } from "react"

import type {
  LegendaryEvent,
  LegendaryEventBattle,
  LegendaryEventLaneId,
  ReadState,
} from "@/entities/legendary-event"
import {
  BattleInfoContext,
  type OpenBattleInfo,
} from "@/features/legendary-event-tokens"

import type { ProgressGridViewModel } from "../legendary-event-page.view-model"
import { BattleInfoDialog } from "./battle-info-dialog"
import type { BattleInfoTarget } from "./battle-info-target"
import { useBattlesSection } from "./use-battles-section"

const NO_LANES: readonly LegendaryEventLaneId[] = []

/**
 * Owns the battle info dialog: which battle is open and that lane's Battles section. The state
 * lives here, not on the page, so opening or stepping the dialog re-renders only the dialog: the
 * page content arrives as `children`, which React leaves alone when only this state changes (web
 * vitals plan item 7). Token rows and the lane figures open it through `BattleInfoContext`.
 */
export function BattleInfoHost({
  event,
  battlesRead,
  progressGrid,
  isMobile,
  children,
}: {
  event: LegendaryEvent
  battlesRead: ReadState<LegendaryEventBattle[]>
  progressGrid: ProgressGridViewModel
  isMobile: boolean
  children: ReactNode
}) {
  const [target, setTarget] = useState<BattleInfoTarget | null>(null)
  const open = useCallback<OpenBattleInfo>(
    (laneId, battleIndex) => setTarget({ laneId, battleIndex }),
    []
  )
  const laneId = target?.laneId
  const laneIds = useMemo(() => (laneId ? [laneId] : NO_LANES), [laneId])
  const battles = useBattlesSection({
    event,
    battlesRead,
    progressGrid,
    laneIds,
  })
  return (
    <BattleInfoContext.Provider value={open}>
      {children}
      <BattleInfoDialog
        battles={battles}
        event={event}
        isMobile={isMobile}
        onChange={setTarget}
        onClose={() => setTarget(null)}
        target={target}
      />
    </BattleInfoContext.Provider>
  )
}
