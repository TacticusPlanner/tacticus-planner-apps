import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Sparkles } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"
import {
  EventProjectsLine,
  useEventProjects,
} from "@/features/project-management"

import { hasEventPlan } from "./legendary-event-plan-entry.model"

/**
 * The event's plan entry beside the header (spec: plan wizard entry points): the linked projects,
 * then the wizard button — a primary **Plan this event** until the event has a plan
 * (`hasEventPlan`), then a secondary **Refine plan**. `showButton` is false where the wizard is
 * unavailable (signed out, archived).
 */
export function LegendaryEventPlanEntry({
  eventId,
  teams,
  showButton,
}: {
  eventId: string
  teams: readonly { laneId: LegendaryEventLaneId }[] | undefined
  showButton: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const projects = useEventProjects(eventId)
  const planned = hasEventPlan(
    teams,
    projects.status === "ready" ? projects.projects.length : undefined
  )
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <EventProjectsLine eventId={eventId} />
      {showButton ? (
        <Button
          asChild
          data-planned={planned}
          data-testid="legendary-event-plan-wizard"
          variant={planned ? "outline" : "default"}
        >
          <Link to={`/legendary-events/${eventId}/plan?from=overview`}>
            <Sparkles aria-hidden="true" />
            {t(planned ? "planWizard.refine" : "planWizard.open")}
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
