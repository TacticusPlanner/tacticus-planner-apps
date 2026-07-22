import { useTranslation } from "react-i18next"
import { Checkbox } from "@workspace/ui/components/checkbox"

import type { ProjectSummary } from "@/entities/project"

import { projectMarkerSuffix } from "../model/project-marker"

/**
 * Checkbox list of every project, used by GoalDetailSheet to show and edit a goal's project
 * membership (a goal may belong to several projects at once). Split out of goal-detail-sheet.tsx to
 * keep that file under this repo's max-lines rule, mirroring how goal-type-fields.tsx/
 * goal-farming-fields.tsx were split out of create-goal-sheet.tsx.
 */
export function GoalProjectsField({
  projects,
  selectedProjectIds,
  projectsValid,
  onToggle,
}: {
  projects: ProjectSummary[]
  selectedProjectIds: string[]
  projectsValid: boolean
  onToggle: (projectId: string, checked: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <section className="grid gap-2" data-testid="goal-detail-projects">
      <h3 className="font-semibold">{t("goals.detail.projectsTitle")}</h3>
      <p className="text-muted-foreground">
        {t("goals.detail.projectsDescription")}
      </p>
      {projects.map((project) => (
        <label className="flex items-center gap-2" key={project.projectId}>
          <Checkbox
            checked={selectedProjectIds.includes(project.projectId)}
            onCheckedChange={(checked) =>
              onToggle(project.projectId, checked === true)
            }
          />
          {project.name}
          {projectMarkerSuffix(t, project)}
        </label>
      ))}
      {!projectsValid ? (
        <p className="text-destructive">{t("goals.detail.projectsRequired")}</p>
      ) : null}
    </section>
  )
}
