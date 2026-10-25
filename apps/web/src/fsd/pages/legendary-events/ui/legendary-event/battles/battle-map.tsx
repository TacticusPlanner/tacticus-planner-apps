import { legendaryEventMap } from "@workspace/game-catalog"

import { BoardMap } from "@/widgets/battle-preview"

/**
 * The battle's map: shown beside the waves on desktop, in a "Map" disclosure on mobile whose open
 * state the section keeps across battles (spec: collapsed by default, stays open on battle change).
 */
export function BattleMap({
  mapId,
  alt,
  isMobile,
  open,
  onOpenChange,
}: {
  mapId: string
  alt: string
  isMobile: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <BoardMap
      alt={alt}
      disclosureId="legendary-event-battle-map"
      isMobile={isMobile}
      mapId={mapId}
      onOpenChange={onOpenChange}
      open={open}
      src={legendaryEventMap(mapId)}
    />
  )
}
