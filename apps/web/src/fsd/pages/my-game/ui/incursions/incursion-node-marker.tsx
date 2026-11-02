import {
  chestIcon,
  incursionEnhancementIcon,
  type ChestTier,
} from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import { medalIcon } from "@/features/daily-raids"
import { EntityIcon } from "@/shared/ui"

import {
  nodeName,
  type Incursion,
  type IncursionNode,
} from "../../model/incursions.model"

const CHEST_TIERS: Record<string, ChestTier> = {
  Bronze: "bronze",
  Silver: "silver",
  Gold: "gold",
  Diamond: "diamond",
}

const STARS = [1, 2, 3] as const

/**
 * A run-map node drawn as the game draws it: a battle's number on a dark disc (ringed orange for a
 * challenge) under the medals earned, an enhancement's icon, or the chest.
 */
export function IncursionNodeMarker({
  node,
  incursion,
  challenge,
  stars,
  size = "md",
}: {
  node: IncursionNode
  incursion: Incursion
  challenge: boolean
  stars?: number
  size?: "sm" | "md"
}) {
  const box = size === "sm" ? "size-8" : "size-9"
  if (node.kind === "battle") {
    return (
      <span className="flex shrink-0 flex-col items-center" aria-hidden="true">
        {stars === undefined ? null : (
          <span className="flex h-3 items-end">
            {STARS.map((count) => (
              <EntityIcon
                key={count}
                src={medalIcon}
                alt=""
                className={cn(
                  "size-3",
                  count > stars && "opacity-25 grayscale"
                )}
              />
            ))}
          </span>
        )}
        <span
          className={cn(
            "flex items-center justify-center rounded-full border-2 bg-zinc-900 text-sm font-bold text-zinc-50 tabular-nums",
            box,
            challenge ? "border-orange-500" : "border-amber-700/70"
          )}
        >
          {nodeName(node)}
        </span>
      </span>
    )
  }
  const src =
    node.kind === "chest"
      ? chestIcon(CHEST_TIERS[node.chest?.type ?? ""] ?? "bronze")
      : incursionEnhancementIcon(
          incursion.enhancements[node.enhancementId ?? ""]?.type ?? ""
        )
  return <EntityIcon src={src} alt="" className={cn("shrink-0", box)} />
}
