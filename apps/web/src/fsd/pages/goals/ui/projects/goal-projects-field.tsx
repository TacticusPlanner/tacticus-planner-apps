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
import { projectConflictText } from "../../model/projects/project-conflict-copy"
import type { ProjectMembershipConflict } from "../../model/projects/project-membership"
import type { ProjectRemovalUnavailableReason } from "../../model/projects/project-removal"

/** Selected project chips plus a searchable, non-archived add picker shared by goal creation/editing.
 * Membership is a whole list, so the caller is handed the next selection rather than a single toggle —
 * removing the last chip replaces it with the Default project in one change, not two. */
export function GoalProjectsField({
  projects,
  selectedProjectIds,
  projectsValid,
  conflicts = [],
  onSelectionChange,
  portalContainer,
  testIdPrefix = "goal-detail",
}: {
  projects: ProjectSummary[]
  selectedProjectIds: string[]
  projectsValid: boolean
  conflicts?: ProjectMembershipConflict[]
  onSelectionChange: (projectIds: string[]) => void
  portalContainer?: HTMLElement | null
  testIdPrefix?: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [removalBlocked, setRemovalBlocked] =
    useState<ProjectRemovalUnavailableReason | null>(null)
  const defaultProject = projects.find((project) => project.isDefault)
  const selected = selectedProjectIds.flatMap((id) => {
    const project = projects.find((candidate) => candidate.projectId === id)
    return project ? [project] : []
  })
  const addable = projects.filter(
    (project) =>
      project.status !== "Archived" &&
      !selectedProjectIds.includes(project.projectId)
  )

  // Removing the last chip relocates the goal to the Default project rather than being refused — the
  // same rule the row menu's removal action follows, so the two surfaces behave identically.
  const remove = (projectId: string) => {
    const remaining = selectedProjectIds.filter((id) => id !== projectId)
    if (remaining.length > 0) {
      setRemovalBlocked(null)
      onSelectionChange(remaining)
      return
    }
    if (!defaultProject) {
      setRemovalBlocked("destinationUnknown")
      return
    }
    if (defaultProject.projectId === projectId) {
      setRemovalBlocked("lastMembershipIsDefault")
      return
    }
    setRemovalBlocked(null)
    onSelectionChange([defaultProject.projectId])
  }

  return (
    <section className="grid gap-2" data-testid={`${testIdPrefix}-projects`}>
      <h3 className="font-semibold">{t("goals.detail.projectsTitle")}</h3>
      <p className="text-muted-foreground">
        {t("goals.detail.projectsDescription")}
      </p>
      {/* States the negative on purpose: the users who asked what membership does had already formed
          the opposite belief, and behavior that silently stops happening does not correct it. */}
      <p
        className="text-sm text-muted-foreground"
        data-testid={`${testIdPrefix}-projects-activation-note`}
      >
        {t("goals.detail.projectsActivationNote")}
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
                  {projectConflictText(
                    t,
                    project.name,
                    conflict.goalTypes,
                    conflict.rankTargetKey
                  )}
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
          container={portalContainer ?? undefined}
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
                    onSelectionChange([
                      ...selectedProjectIds,
                      project.projectId,
                    ])
                    setRemovalBlocked(null)
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

      {!projectsValid || removalBlocked ? (
        <p className="text-destructive" role="alert">
          {removalBlocked === "lastMembershipIsDefault"
            ? t("goals.project.removeLastMembership")
            : removalBlocked === "destinationUnknown"
              ? t("goals.project.removeDestinationUnknown")
              : t("goals.detail.projectsRequired")}
        </p>
      ) : null}
    </section>
  )
}
