import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { ProjectSummary } from "../model/types"
import { projectMarkerSuffix } from "../model/project-marker"
import { ProjectColorDot } from "./project-color-dot"

const ALL_PROJECTS_VALUE = "__all__"

export function ProjectSelect({
  projects,
  projectId,
  onProjectIdChange,
  allowAll = false,
  testId,
  placeholder,
}: {
  projects: ProjectSummary[]
  projectId: string | undefined
  onProjectIdChange: (projectId: string | undefined) => void
  allowAll?: boolean
  testId?: string
  placeholder?: string
}) {
  const { t } = useTranslation()
  const value = projectId ?? (allowAll ? ALL_PROJECTS_VALUE : "")

  return (
    <Select
      onValueChange={(nextValue) =>
        onProjectIdChange(
          nextValue === ALL_PROJECTS_VALUE ? undefined : nextValue
        )
      }
      value={value}
    >
      <SelectTrigger className="w-56" data-testid={testId}>
        <SelectValue
          placeholder={placeholder ?? t("goals.insights.selectProject")}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {allowAll ? (
            <SelectItem value={ALL_PROJECTS_VALUE}>
              {t("goals.project.filterAll")}
            </SelectItem>
          ) : null}
          {projects
            .filter((project) => project.status !== "Archived")
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
