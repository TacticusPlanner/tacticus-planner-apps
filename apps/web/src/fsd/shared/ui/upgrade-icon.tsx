import {
  craftedUpgradeBadge,
  upgradeFrameIcon,
  upgradeIcon,
  upgradeIconFallback,
  upgradeUnderlay,
  type Rarity,
} from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "./entity-icon"

/** Underlay + material icon + rarity frame, layered the same way V1's upgrade-image.tsx does. */
export function UpgradeIcon({
  id,
  rarity,
  crafted,
  className = "size-8",
}: {
  id: string
  rarity?: Rarity
  crafted?: boolean
  className?: string
}) {
  return (
    <span className={cn("relative inline-block", className)}>
      <img
        src={upgradeUnderlay}
        alt=""
        className="absolute inset-0 size-full object-contain"
      />
      <EntityIcon
        src={upgradeIcon(id)}
        fallback={upgradeIconFallback}
        alt=""
        className="absolute top-1/2 left-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 object-contain"
      />
      {rarity ? (
        <img
          src={upgradeFrameIcon(rarity)}
          alt=""
          className="absolute inset-0 size-full object-contain"
        />
      ) : null}
      {crafted ? (
        <img
          src={craftedUpgradeBadge}
          alt=""
          className="absolute bottom-0 left-0 size-2/5 object-contain"
        />
      ) : null}
    </span>
  )
}
