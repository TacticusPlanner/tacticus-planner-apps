import type { ReactNode } from "react"
import type { GameIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "./entity-icon"

/** A list line led by the game's glyph for what it counts (points, tokens, currency…). The icon is
 *  decorative: the text still names the resource, so it reads the same without the image. */
export function IconLine({
  icon,
  children,
  className,
  iconClassName,
  testId,
}: {
  icon: GameIcon | undefined
  children: ReactNode
  className?: string
  iconClassName?: string
  testId?: string
}) {
  return (
    <li
      className={cn("flex items-center gap-1.5", className)}
      data-testid={testId}
    >
      {icon ? (
        <EntityIcon
          alt=""
          className={cn("size-4 shrink-0", iconClassName)}
          src={icon}
        />
      ) : null}
      <span className="min-w-0">{children}</span>
    </li>
  )
}
