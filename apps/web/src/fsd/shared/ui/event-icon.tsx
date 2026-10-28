import { eventIcon } from "@workspace/game-catalog"

import { EntityIcon } from "./entity-icon"
import { EventTypeIcon } from "./event-type-icon"

/** A calendar event's game art (its Home Screen Event medallion or its type's icon), falling back to
 *  the generic per-type glyph where the game ships none. Decorative: name the event in nearby text. */
export function EventIcon({
  definitionId,
  definitionType,
  parameters,
  className,
}: {
  definitionId: string
  definitionType: string | undefined
  parameters?: Readonly<Record<string, unknown>> | null
  className?: string
}) {
  const src = eventIcon(definitionId, definitionType, parameters)
  if (!src) {
    return (
      <EventTypeIcon className={className} definitionType={definitionType} />
    )
  }
  return <EntityIcon alt="" className={className} src={src} />
}
