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
import type { useProjectActions } from "../../model/projects/use-project-actions"

export function ManageProjectsSheet({
  open,
  onOpenChange,
  projects,
  actions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: ProjectSummary[]
  actions: ReturnType<typeof useProjectActions>
}) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = projects.find((project) => project.projectId === selectedId)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("")

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    if (selected) {
      void actions
        .save(selected, {
          ...selected,
          name: name.trim(),
          description: description.trim() || null,
          color: color.trim() || null,
        })
        .then((ok) => ok && setName(name.trim()))
    } else {
      void actions
        .create(name.trim(), description.trim() || null, color.trim() || null)
        .then((ok) => ok && setName(""))
    }
  }

  const setProject = (project: ProjectSummary | undefined) => {
    setSelectedId(project?.projectId ?? null)
    setName(project?.name ?? "")
    setDescription(project?.description ?? "")
    setColor(project?.color ?? "")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="overflow-y-auto"
        data-testid="manage-projects-sheet"
      >
        <SheetHeader>
          <SheetTitle>{t("goals.project.manageTitle")}</SheetTitle>
          <SheetDescription>
            {t("goals.project.manageDescription")}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-2 px-4">
          <Button
            variant={!selected ? "secondary" : "outline"}
            onClick={() => setProject(undefined)}
          >
            {t("goals.project.newProject")}
          </Button>
          {projects.map((project) => (
            <Button
              className="justify-between"
              key={project.projectId}
              variant={selectedId === project.projectId ? "secondary" : "ghost"}
              onClick={() => setProject(project)}
            >
              <span>{project.name}</span>
              {project.status === "Archived"
                ? t("goals.status.Archived")
                : null}
            </Button>
          ))}
        </div>

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
            <Input
              id="project-color"
              placeholder="#6366f1"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
          </Field>
          {selected ? (
            <div className="flex gap-2">
              {selected.status === "Archived" ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={actions.pending}
                  onClick={() =>
                    void actions.save(selected, {
                      ...selected,
                      status: "Active",
                    })
                  }
                >
                  {t("goals.project.restore")}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={
                    actions.pending ||
                    selected.isDefault ||
                    selected.isActivePlan
                  }
                  onClick={() =>
                    void actions.save(selected, {
                      ...selected,
                      status: "Archived",
                    })
                  }
                >
                  {t("goals.project.archive")}
                </Button>
              )}
            </div>
          ) : null}
        </form>

        <SheetFooter>
          <Button
            disabled={!name.trim() || actions.pending}
            form="manage-project-form"
            type="submit"
          >
            {selected ? t("goals.project.save") : t("goals.project.create")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
