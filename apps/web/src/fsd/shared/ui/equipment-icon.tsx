import { EquipmentIcons } from "@workspace/game-catalog"
import type { EquipmentId, Rarity } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "./entity-icon"

/** Item art + rarity frame (+ an extra relic frame for isRelic pieces), layered the same way V1's
 * equipment-icon.tsx does. `id` takes a plain string — the Equipment goal flow handles equipment
 * ids unbranded throughout (see `use-create-equipment-goal-form.ts`), unlike upgrade/unit ids
 * elsewhere in this app. */
export function EquipmentIcon({
  id,
  rarity,
  isRelic,
  className = "size-8",
}: {
  id: string
  rarity?: Rarity
  isRelic?: boolean
  className?: string
}) {
  return (
    <span className={cn("relative inline-block", className)}>
      <EntityIcon
        src={EquipmentIcons.icon(id as EquipmentId)}
        fallback={EquipmentIcons.fallback}
        alt=""
        className="absolute top-1/2 left-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 object-contain"
      />
      {rarity ? (
        <img
          src={EquipmentIcons.frame(rarity)}
          alt=""
          className="absolute inset-0 size-full object-contain"
        />
      ) : null}
      {isRelic ? (
        <img
          src={EquipmentIcons.relicFrame}
          alt=""
          className="absolute inset-0 size-full object-contain"
        />
      ) : null}
    </span>
  )
}
