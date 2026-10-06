import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"

import type { LegendaryEventPageViewProps } from "./legendary-event-page.view-model"

/** The event's portrait, localized unit name and lifecycle badge. */
export function LegendaryEventHeader({
  event,
  lifecycle,
  name,
}: Pick<LegendaryEventPageViewProps, "event" | "lifecycle" | "name">) {
  const { t } = useTranslation("legendaryEvents")
  const portrait = characterIcon(event.id as UnitId)
  return (
    <div className="flex min-w-0 items-center gap-3">
      {portrait ? (
        <img
          alt=""
          aria-hidden="true"
          className="size-12 shrink-0 rounded-full object-cover"
          src={portrait}
        />
      ) : null}
      <h1
        className="min-w-0 truncate text-xl font-semibold"
        data-testid="legendary-event-title"
      >
        {name}
      </h1>
      <Badge
        data-state={lifecycle.state}
        data-testid="legendary-event-lifecycle"
        variant={lifecycle.state === "active" ? "default" : "secondary"}
      >
        {t(`lifecycle.${lifecycle.state}`)}
      </Badge>
    </div>
  )
}
