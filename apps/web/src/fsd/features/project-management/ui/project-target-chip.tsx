import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"

import type { ProjectTarget } from "@/entities/project"

import { useEventTargetOptions } from "../model/event-target-options"

/** A project card's target chip (project-event-target): "LE · Uthar" linking to the event page, or
 *  "LE · <eventId>" without a link once the catalog no longer serves that event. */
export function ProjectTargetChip({ target }: { target: ProjectTarget }) {
  const { t } = useTranslation()
  const option = useEventTargetOptions().find(
    (entry) => entry.eventId === target.eventId
  )
  const label = t("goals.project.targetChip", {
    name: option?.name ?? target.eventId,
  })

  return option ? (
    <Badge asChild variant="outline">
      <Link
        data-testid="project-target-chip"
        to={`/legendary-events/${target.eventId}`}
      >
        {label}
      </Link>
    </Badge>
  ) : (
    <Badge data-testid="project-target-chip" variant="outline">
      {label}
    </Badge>
  )
}
