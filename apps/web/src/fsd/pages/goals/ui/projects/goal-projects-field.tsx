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
import { isProjectNameValid, ProjectColorDot } from "@/entities/project"
import { ApiError } from "@/shared/api"
import { useInlineProjectCreate } from "../../model/projects/use-inline-project-create"
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
  testIdPrefix = "goal-edit",
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
  const [search, setSearch] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)
  const { create, pending: creating } = useInlineProjectCreate()
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

  // Offered only for a valid name no project already carries (archived ones included, so it can never
  // produce a duplicate) - typing alone creates nothing, the user has to choose the row.
  const searched = search.trim()
  const canCreate =
    isProjectNameValid(searched) &&
    !projects.some(
      (project) => project.name.trim().toLowerCase() === searched.toLowerCase()
    )

  const changeOpen = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setSearch("")
      setCreateError(null)
    }
  }

  const createAndSelect = async () => {
    if (creating || !canCreate) return
    setCreateError(null)
    try {
      const created = await create(searched)
      onSelectionChange([...selectedProjectIds, created.projectId])
      setRemovalBlocked(null)
      changeOpen(false)
    } catch (error) {
      // The typed name and the goal draft stay as they are so the user can retry or pick another name.
      setCreateError(
        error instanceof ApiError && error.message
          ? error.message
          : t("goals.project.createFailed")
      )
    }
  }

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
    <section className="grid gap-1.5" data-testid={`${testIdPrefix}-projects`}>
      <h3 className="font-semibold">{t("goals.detail.projectsTitle")}</h3>
      <div className="flex flex-wrap items-start gap-1.5">
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
        <Popover open={open} onOpenChange={changeOpen}>
          <PopoverTrigger asChild>
            <Button
              className="w-fit"
              data-testid={`${testIdPrefix}-add-project`}
              size="sm"
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
              <CommandInput
                onValueChange={(value) => {
                  setSearch(value)
                  setCreateError(null)
                }}
                placeholder={t("goals.project.searchProjects")}
                value={search}
              />
              <CommandList>
                {canCreate ? null : (
                  <CommandEmpty>
                    {t("goals.project.noAddableProjects")}
                  </CommandEmpty>
                )}
                {addable.map((project) => (
                  <CommandItem
                    key={project.projectId}
                    onSelect={() => {
                      onSelectionChange([
                        ...selectedProjectIds,
                        project.projectId,
                      ])
                      setRemovalBlocked(null)
                      changeOpen(false)
                    }}
                    value={project.name}
                  >
                    <ProjectColorDot color={project.color} />
                    <span className="flex-1">{project.name}</span>
                    {project.isDefault ? <Check className="size-4" /> : null}
                  </CommandItem>
                ))}
                {canCreate ? (
                  <CommandItem
                    data-testid={`${testIdPrefix}-create-project`}
                    disabled={creating}
                    forceMount
                    onSelect={() => void createAndSelect()}
                    value={`create-project:${searched}`}
                  >
                    <Plus className="size-4" />
                    <span className="flex-1 break-all">
                      {creating
                        ? t("goals.project.creatingInline", { name: searched })
                        : t("goals.project.createInline", { name: searched })}
                    </span>
                  </CommandItem>
                ) : null}
              </CommandList>
            </Command>
            {canCreate ? (
              <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                {t("goals.project.createInlineNote")}
              </p>
            ) : null}
            {createError ? (
              <p
                className="border-t px-3 py-2 text-xs text-destructive"
                data-testid={`${testIdPrefix}-create-project-error`}
                role="alert"
              >
                {createError}
              </p>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>

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
