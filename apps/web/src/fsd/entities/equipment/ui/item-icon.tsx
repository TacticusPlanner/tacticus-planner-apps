import { EquipmentIcons } from "@workspace/game-catalog"
import type { EquipmentId, Rarity } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, entityIconClassName } from "@/shared/ui"

/**
 * An item's art on its rarity frame, with the relic frame over a relic, as the game draws it: the art
 * centred at 70% inside the frame. Sized on the icon ramp (ui-style-guide rule 6): `icon-lg` in a
 * row, `icon-2xl` on a card. `level` adds the level in a corner badge.
 */
export function ItemIcon({
  item,
  size,
  level,
  alt = "",
  className,
}: {
  item: { id: EquipmentId | string; rarity: Rarity; isRelic: boolean }
  size: "icon-lg" | "icon-xl" | "icon-2xl"
  level?: number
  alt?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "relative inline-block shrink-0",
        entityIconClassName(size),
        className
      )}
      data-testid="item-icon"
    >
      <EntityIcon
        alt={alt}
        className="absolute inset-[15%] size-[70%]"
        fallback={EquipmentIcons.fallback}
        src={EquipmentIcons.icon(item.id as EquipmentId)}
      />
      <EntityIcon
        alt=""
        className="absolute inset-0 size-full"
        src={EquipmentIcons.frame(item.rarity)}
      />
      {item.isRelic ? (
        <EntityIcon
          alt=""
          className="absolute inset-0 size-full"
          src={EquipmentIcons.relicFrame}
        />
      ) : null}
      {level === undefined ? null : (
        <span className="absolute right-0 bottom-0 rounded-sm bg-background/90 px-0.5 text-2xs leading-none font-semibold tabular-nums">
          {level}
        </span>
      )}
    </span>
  )
}
