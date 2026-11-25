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
 *  the run dates as a tooltip. `link` makes it open the deadline's page where it has one. `short`
 *  shows the timing alone, its name moving to the tooltip and the accessible text. */
function DeadlineChip({
  model,
  link,
  short,
  testId,
}: {
  model: DeadlineChipModel
  link: boolean
  short: boolean
  testId: string
}) {
  const text = useDeadlineChipText(model)
  const content = (
    <>
      <CalendarDays aria-hidden="true" />
      {short ? (
        <>
          <span aria-hidden="true">{text.shortLabel}</span>
          <span className="sr-only">{text.label}</span>
        </>
      ) : (
        text.label
      )}
    </>
  )
  const hint = short
    ? [text.label, text.hint].filter(Boolean).join(" · ")
    : text.hint
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
  short = false,
  testId,
}: {
  project: Pick<ProjectSummary, "projectId" | "target">
  link: boolean
  short?: boolean
  testId: string
}) {
  const model = useProjectDeadlineChip(project)
  return model ? (
    <DeadlineChip link={link} model={model} short={short} testId={testId} />
  ) : null
}
