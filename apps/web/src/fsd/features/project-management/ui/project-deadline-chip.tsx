import { Link } from "react-router"
import { CalendarDays } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import type { ProjectSummary } from "@/entities/project"

import {
  useDeadlineChipText,
  useProjectDeadlineChip,
} from "../model/deadline-chip"
import type { DeadlineChipModel } from "../model/deadline-chip"

/** One deadline chip (project-deadline-chip): the deadline's icon, then its name and timing, with
 *  the run dates as a tooltip. `link` makes it open the deadline's page where it has one. */
function DeadlineChip({
  model,
  link,
  testId,
}: {
  model: DeadlineChipModel
  link: boolean
  testId: string
}) {
  const { label, hint } = useDeadlineChipText(model)
  const content = (
    <>
      <CalendarDays aria-hidden="true" />
      {label}
    </>
  )
  const chip =
    link && model.href ? (
      <Badge asChild data-state-timing={model.timing?.state} variant="outline">
        <Link data-testid={testId} to={model.href}>
          {content}
        </Link>
      </Badge>
    ) : (
      <Badge
        data-state-timing={model.timing?.state}
        data-testid={testId}
        variant="outline"
      >
        {content}
      </Badge>
    )
  if (!hint) return chip
  return (
    <Tooltip>
      <TooltipTrigger asChild>{chip}</TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}

/** A project card's deadline chip; nothing for a project without a deadline. */
export function ProjectDeadlineChip({
  project,
  link,
  testId,
}: {
  project: Pick<ProjectSummary, "projectId" | "target">
  link: boolean
  testId: string
}) {
  const model = useProjectDeadlineChip(project)
  return model ? (
    <DeadlineChip link={link} model={model} testId={testId} />
  ) : null
}
