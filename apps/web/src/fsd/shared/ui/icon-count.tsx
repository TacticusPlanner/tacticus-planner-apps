import type { GameIcon } from "@workspace/game-catalog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import { Pressable } from "@workspace/ui/components/pressable"

import { EntityIcon } from "./entity-icon"

/**
 * A reward or cost as the game shows it: the item's icon and its count ("×4"), the item's name in a
 * tooltip and for assistive technology. Use it where copy would spell out "4 × Tigurius mythic shards".
 */
export function IconCount({
  icon,
  name,
  count,
  className,
  "data-testid": testId,
}: {
  icon: GameIcon
  name: string
  /** Already formatted for the locale. */
  count: string
  className?: string
  "data-testid"?: string
}) {
  return (
    <li
      className={cn(
        "inline-flex h-6 items-center rounded-full border text-xs font-semibold tabular-nums",
        className
      )}
      data-testid={testId}
    >
      <Tooltip>
        {/* A button, so a keyboard user can reach the tooltip: the chip's only visible name. */}
        <TooltipTrigger asChild>
          <Pressable className="inline-flex h-full items-center gap-1 rounded-full px-2">
            <EntityIcon size="icon" src={icon} alt="" />
            <span className="sr-only">{`${name} ×${count}`}</span>
            <span aria-hidden="true">×{count}</span>
          </Pressable>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    </li>
  )
}
