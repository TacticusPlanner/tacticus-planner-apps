import { eventIcon } from "@workspace/game-catalog"

import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "./entity-icon"
import { EventTypeIcon } from "./event-type-icon"
import { entityIconClassName } from "./game-icon-size"
import type { EntityIconSize } from "./game-icon-size"

/** A calendar event's game art (its Home Screen Event medallion or its type's icon), falling back to
 *  the generic per-type glyph where the game ships none. Decorative: name the event in nearby text.
 *  `size` is the style guide's icon role and applies to the glyph fallback too. */
export function EventIcon({
  definitionId,
  definitionType,
  parameters,
  size,
  className,
}: {
  definitionId: string
  definitionType: string | undefined
  parameters?: Readonly<Record<string, unknown>> | null
  size: EntityIconSize
  className?: string
}) {
  const src = eventIcon(definitionId, definitionType, parameters)
  if (!src) {
    return (
      <EventTypeIcon
        className={cn(entityIconClassName(size), className)}
        definitionType={definitionType}
      />
    )
  }
  return <EntityIcon alt="" size={size} className={className} src={src} />
}
