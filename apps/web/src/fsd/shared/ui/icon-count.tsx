import type { GameIcon } from "@workspace/game-catalog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

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
    <Tooltip>
      <TooltipTrigger asChild>
        <li
          className={cn(
            "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs font-semibold tabular-nums",
            className
          )}
          data-testid={testId}
        >
          <EntityIcon size="inline" src={icon} alt="" />
          <span className="sr-only">{name}</span>
          <span aria-hidden="true">×{count}</span>
        </li>
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  )
}
