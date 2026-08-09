import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Plus, X } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

import type { ProjectSummary } from "@/entities/project"
import { ProjectColorDot } from "@/entities/project"
import type { ProjectMembershipConflict } from "../../model/projects/project-membership"

/** Selected project chips plus a searchable, non-archived add picker shared by goal creation/editing. */
export function GoalProjectsField({
  projects,
  selectedProjectIds,
  projectsValid,
  conflicts = [],
  onToggle,
  testIdPrefix = "goal-detail",
}: {
  projects: ProjectSummary[]
  selectedProjectIds: string[]
  projectsValid: boolean
  conflicts?: ProjectMembershipConflict[]
  onToggle: (projectId: string, checked: boolean) => void
  testIdPrefix?: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [lastRemovalBlocked, setLastRemovalBlocked] = useState(false)
  const selected = selectedProjectIds.flatMap((id) => {
    const project = projects.find((candidate) => candidate.projectId === id)
    return project ? [project] : []
  })
  const addable = projects.filter(
    (project) =>
      project.status !== "Archived" &&
      !selectedProjectIds.includes(project.projectId)
  )

  const remove = (projectId: string) => {
    if (selectedProjectIds.length <= 1) {
      setLastRemovalBlocked(true)
      return
    }
    setLastRemovalBlocked(false)
    onToggle(projectId, false)
  }

  return (
    <section className="grid gap-2" data-testid={`${testIdPrefix}-projects`}>
      <h3 className="font-semibold">{t("goals.detail.projectsTitle")}</h3>
      <p className="text-muted-foreground">
        {t("goals.detail.projectsDescription")}
      </p>
      <div className="flex flex-wrap gap-2">
        {selected.map((project) => {
          const conflict = conflicts.find(
            (candidate) => candidate.projectId === project.projectId
          )
          return (
            <div
              className="grid gap-1"
              data-testid={`${testIdPrefix}-project-chip-${project.projectId}`}
              key={project.projectId}
            >
              <Badge className="gap-1.5 py-1" variant="outline">
                <ProjectColorDot color={project.color} />
                <span>{project.name}</span>
                {project.isActivePlan ? (
                  <span className="text-primary">
                    {t("goals.project.currentPlan")}
                  </span>
                ) : null}
                {project.isDefault ? (
                  <span>{t("goals.create.projectDefaultMarker")}</span>
                ) : null}
                {project.status === "Archived" ? (
                  <span>{t("goals.status.Archived")}</span>
                ) : null}
                <button
                  aria-label={t("goals.project.removeMembership", {
                    project: project.name,
                  })}
                  className="rounded-full p-0.5 hover:bg-muted"
                  onClick={() => remove(project.projectId)}
                  type="button"
                >
                  <X className="size-3" />
                </button>
              </Badge>
              {conflict ? (
                <p className="max-w-64 text-xs text-destructive" role="alert">
                  {t("goals.project.membershipConflict", {
                    project: project.name,
                    types: conflict.goalTypes.join(", "),
                  })}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            className="w-fit"
            data-testid={`${testIdPrefix}-add-project`}
            type="button"
            variant="outline"
          >
            <Plus />
            {t("goals.project.addMembership")}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(24rem,calc(100vw-2rem))] p-0"
        >
          <Command>
            <CommandInput placeholder={t("goals.project.searchProjects")} />
            <CommandList>
              <CommandEmpty>
                {t("goals.project.noAddableProjects")}
              </CommandEmpty>
              {addable.map((project) => (
                <CommandItem
                  key={project.projectId}
                  onSelect={() => {
                    onToggle(project.projectId, true)
                    setLastRemovalBlocked(false)
                    setOpen(false)
                  }}
                  value={project.name}
                >
                  <ProjectColorDot color={project.color} />
                  <span className="flex-1">{project.name}</span>
                  {project.isActivePlan ? (
                    <span className="text-xs text-primary">
                      {t("goals.project.currentPlan")}
                    </span>
                  ) : null}
                  {project.isDefault ? <Check className="size-4" /> : null}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {!projectsValid || lastRemovalBlocked ? (
        <p className="text-destructive" role="alert">
          {t("goals.detail.projectsRequired")}
        </p>
      ) : null}
    </section>
  )
}
