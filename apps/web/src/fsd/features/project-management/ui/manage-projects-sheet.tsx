import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

import type { ProjectSummary } from "@/entities/project"
import type { useProjectActions } from "../model/use-project-actions"
import { ProjectColorPicker } from ".//project-color-picker"

/**
 * The create/edit form for a project (project-management spec: "Creating and editing a project
 * uses a form Sheet") — narrowed from its previous shape, which combined this form with an
 * embedded project list/selection; that list now lives permanently on the Projects page itself (see
 * `ProjectList`). `project` undefined means "New project" (blank form); a `ProjectSummary` means
 * "Edit" (pre-filled). Submitting saves the change and closes the Sheet either way. Lifecycle
 * actions (Make current/Archive/Restore) are no longer available here - they moved to each project
 * list row.
 */
export function ManageProjectsSheet({
  open,
  onOpenChange,
  project,
  actions,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: ProjectSummary | undefined
  actions: ReturnType<typeof useProjectActions>
  /** Called with the newly created project instead of the default close-only behavior, when this
   *  Sheet is opened in create mode (`project` undefined) by a caller that needs the result — e.g.
   *  the goal row's "Move to project" flow, moving the goal into the project once it exists
   *  (`rework-goal-project-move-action`). Ignored while editing an existing project. */
  onCreated?: (project: ProjectSummary) => void
}) {
  const { t } = useTranslation()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="overflow-y-auto"
        data-testid="manage-projects-sheet"
      >
        <SheetHeader>
          <SheetTitle>
            {project
              ? t("goals.project.editTitle")
              : t("goals.project.newProjectTitle")}
          </SheetTitle>
          <SheetDescription>
            {t("goals.project.formDescription")}
          </SheetDescription>
        </SheetHeader>

        {/* Unmounted while closed and keyed by the target project (or "new") - so every time it
            opens, local form state starts fresh from the current `project` prop rather than
            needing an effect to resync state that a previous open may have left behind. */}
        {open ? (
          <ProjectForm
            actions={actions}
            key={project?.projectId ?? "new"}
            onSaved={(created) => {
              if (created && !project && onCreated) {
                onCreated(created)
              } else {
                onOpenChange(false)
              }
            }}
            project={project}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function ProjectForm({
  project,
  actions,
  onSaved,
}: {
  project: ProjectSummary | undefined
  actions: ReturnType<typeof useProjectActions>
  onSaved: (created: ProjectSummary | null) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(project?.name ?? "")
  const [description, setDescription] = useState(project?.description ?? "")
  const [color, setColor] = useState(project?.color ?? "")

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    const trimmedName = name.trim()
    const trimmedDescription = description.trim() || null
    const trimmedColor = color.trim() || null

    if (project) {
      void actions
        .save(project, {
          ...project,
          name: trimmedName,
          description: trimmedDescription,
          color: trimmedColor,
        })
        .then((ok) => ok && onSaved(null))
      return
    }
    void actions
      .create(trimmedName, trimmedDescription, trimmedColor)
      .then((created) => created && onSaved(created))
  }

  return (
    <>
      <form
        className="grid gap-4 px-4"
        id="manage-project-form"
        onSubmit={submit}
      >
        <Field>
          <FieldLabel htmlFor="project-name">
            {t("goals.project.name")}
          </FieldLabel>
          <Input
            id="project-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="project-description">
            {t("goals.project.description")}
          </FieldLabel>
          <Input
            id="project-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="project-color">
            {t("goals.project.color")}
          </FieldLabel>
          <ProjectColorPicker onChange={setColor} value={color} />
          <Input
            aria-label={t("goals.project.color")}
            id="project-color"
            placeholder="#6366f1"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
        </Field>
      </form>

      <SheetFooter>
        <Button
          disabled={!name.trim() || actions.pending}
          form="manage-project-form"
          type="submit"
        >
          {project ? t("goals.project.save") : t("goals.project.create")}
        </Button>
      </SheetFooter>
    </>
  )
}
