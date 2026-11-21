import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

import type { ProjectSummary } from "../model/types"
import { projectMarkerSuffix } from "../model/project-marker"
import { ProjectColorDot } from "./project-color-dot"

const ALL_PROJECTS_VALUE = "__all__"

/**
 * The one project selector every Goals/Dailies page that scopes by project uses, first in the
 * toolbar's Find slot (goals-navigation spec's "Consistent project selector" requirement). It
 * shows the chosen project ("All projects" or its name) on every viewport, never icon-only
 * (ui-style-guide rule 3).
 */
export function ProjectSelect({
  projects,
  projectId,
  onProjectIdChange,
  allowAll = false,
  testId,
  label,
  placeholder,
  allLabel,
  counts,
  className,
}: {
  projects: ProjectSummary[]
  projectId: string | undefined
  onProjectIdChange: (projectId: string | undefined) => void
  allowAll?: boolean
  testId?: string
  /** The trigger's accessible name, like the other toolbar selects' filter labels. */
  label?: string
  placeholder?: string
  /** The "all" option's text; defaults to "All projects". */
  allLabel?: string
  /** Goals per project id, shown after each name; `all` is the "all" option's count. */
  counts?: { all: number; byProject: ReadonlyMap<string, number> }
  className?: string
}) {
  const { t } = useTranslation()
  const value = projectId ?? (allowAll ? ALL_PROJECTS_VALUE : "")
  const resolvedPlaceholder = placeholder ?? t("goals.insights.selectProject")

  return (
    <Select
      onValueChange={(nextValue) =>
        onProjectIdChange(
          nextValue === ALL_PROJECTS_VALUE ? undefined : nextValue
        )
      }
      value={value}
    >
      <SelectTrigger
        aria-label={label}
        className={cn("max-w-full min-w-56", className)}
        data-testid={testId}
      >
        <SelectValue placeholder={resolvedPlaceholder} />
      </SelectTrigger>
      {/* Positioned against the trigger (`position="popper"`). */}
      <SelectContent position="popper">
        <SelectGroup>
          {allowAll ? (
            <SelectItem
              data-testid={testId ? `${testId}-option-all` : undefined}
              value={ALL_PROJECTS_VALUE}
            >
              {allLabel ?? t("goals.project.filterAll")}
              {counts ? <Count value={counts.all} /> : null}
            </SelectItem>
          ) : null}
          {/* Archived projects aren't offered as new destinations to switch to, but the
              currently-selected one stays in the list even if archived (e.g. the Projects detail
              route for an archived project, reached from its list row) - otherwise its id matches
              no option here and the trigger silently falls back to the placeholder instead of
              showing which project is actually selected. */}
          {projects
            .filter(
              (project) =>
                project.status !== "Archived" || project.projectId === projectId
            )
            .map((project) => (
              <SelectItem
                data-testid={
                  testId ? `${testId}-option-${project.projectId}` : undefined
                }
                key={project.projectId}
                value={project.projectId}
              >
                <ProjectColorDot color={project.color} />
                {project.name}
                {projectMarkerSuffix(t, project)}
                {counts ? (
                  <Count value={counts.byProject.get(project.projectId) ?? 0} />
                ) : null}
              </SelectItem>
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function Count({ value }: { value: number }) {
  return <span className="text-muted-foreground tabular-nums">{value}</span>
}
