import { useTranslation } from "react-i18next"
import { FolderKanban } from "lucide-react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
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
 * The one project-selector implementation every Goals/Dailies subpage with a project selector
 * should use (goals-navigation spec's "Consistent project selector" requirement) — previously
 * duplicated as a hand-rolled `<Select>` in Insights and again inside `ProjectToolbar`. Below the
 * 768px mobile breakpoint it renders icon-only (Decision 4): callers no longer need their own
 * `isMobile ? null : <SelectValue />` conditional, and the accessible name (`aria-label`, falling
 * back to the same text used for the placeholder) is preserved either way.
 */
export function ProjectSelect({
  projects,
  projectId,
  onProjectIdChange,
  allowAll = false,
  testId,
  placeholder,
  compact,
  className,
}: {
  projects: ProjectSummary[]
  projectId: string | undefined
  onProjectIdChange: (projectId: string | undefined) => void
  allowAll?: boolean
  testId?: string
  placeholder?: string
  // Overrides the default icon-only-below-768px behavior. Pass `false` when a caller wants the
  // full name shown regardless of viewport (e.g. its own layout already stacks to a full-width row
  // on mobile instead of relying on this component to compress itself).
  compact?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const iconOnly = compact ?? isMobile
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
        aria-label={iconOnly ? resolvedPlaceholder : undefined}
        className={cn(iconOnly ? undefined : "w-56", className)}
        data-testid={testId}
      >
        {iconOnly ? (
          <FolderKanban aria-hidden="true" />
        ) : (
          <SelectValue placeholder={resolvedPlaceholder} />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {allowAll ? (
            <SelectItem value={ALL_PROJECTS_VALUE}>
              {t("goals.project.filterAll")}
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
              <SelectItem key={project.projectId} value={project.projectId}>
                <ProjectColorDot color={project.color} />
                {project.name}
                {projectMarkerSuffix(t, project)}
              </SelectItem>
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
