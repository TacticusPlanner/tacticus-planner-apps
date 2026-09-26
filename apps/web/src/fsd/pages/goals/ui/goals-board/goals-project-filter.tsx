import { useTranslation } from "react-i18next"
import { FolderKanban } from "lucide-react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { ProjectSummary } from "@/entities/project"

/** The filter's unfiltered option. Not "no project": every goal always belongs to at least one. */
export const ALL_PROJECTS = "__all__"

/**
 * goals-navigation spec: the project-membership filter joins the Type/Group group rather than the
 * status row, and is explicitly not a `ProjectSelect` — it selects no project for any view to
 * operate on.
 */
export function ProjectFilterSelect({
  projects,
  value,
  onChange,
}: {
  projects: readonly ProjectSummary[]
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const label =
    value === ALL_PROJECTS
      ? t("goals.project.filterAll")
      : (projects.find((candidate) => candidate.projectId === value)?.name ??
        t("goals.project.filterAll"))

  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger
        aria-describedby="goals-project-filter-value"
        aria-label={t("goals.project.filterLabel")}
        data-testid="goals-project-filter"
      >
        <FolderKanban />
        {isMobile ? null : <SelectValue />}
        <span className="sr-only" id="goals-project-filter-value">
          {label}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_PROJECTS}>
          {t("goals.project.filterAll")}
        </SelectItem>
        {projects.map((candidate) => (
          <SelectItem key={candidate.projectId} value={candidate.projectId}>
            {candidate.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
