import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { ProjectSummary } from "@/entities/project"
import {
  ManageProjectsSheet,
  useProjectActions,
} from "@/features/project-management"

import type { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { isOnlyMemberOf } from "../../model/projects/project-removal"
import type { GoalRow } from "../../model/shared/types"
import { ProjectPickerDialog } from "./project-picker-dialog"

/** What a row menu and the bulk bar need to offer "Remove from this project" while the Goals page is
 *  scoped to `project`. Absent when the page is not scoped, which is what hides the action. */
export type ProjectRemoval = {
  project: ProjectSummary
  /** False while the account's projects (the possible destinations) are not loaded. */
  available: boolean
  /** Removes `rows` from `project`, first asking for a destination when any of them has no other
   *  project. `onDone` runs once the removal has finished; it does not run if the picker is dismissed. */
  request: (rows: readonly GoalRow[], onDone?: () => void) => void
}

/** Whether `row` can be offered removal right now: its memberships must be known, as must the
 *  destinations a last-membership row would need. */
export function canRemoveFromProject(
  removal: ProjectRemoval,
  row: GoalRow
): boolean {
  return removal.available && (row.projects?.length ?? 0) > 0
}

/** Whether removing `row` from the scoped project moves it (its only project) rather than just
 *  leaving it, which decides the row action's label. */
export function removalMovesRow(
  removal: ProjectRemoval,
  row: GoalRow
): boolean {
  return isOnlyMemberOf(row, removal.project.projectId)
}

type Pending = {
  rows: GoalRow[]
  relocating: number
  onDone?: () => void
}

/**
 * The Goals page's one project-removal flow, shared by every row menu and the bulk bar so they cannot
 * drift (`goal-project-membership`). Rows that belong to another project are just removed; when any of
 * the rows has the scoped project as its only one, a destination picker opens first (or project
 * creation, when there is no other project to choose), and the whole batch then goes through
 * `useGoalActions().removeFromProject`. Render `dialogs` once on the page.
 */
export function useProjectRemovalFlow({
  actions,
  projects,
  project,
  available,
}: {
  actions: ReturnType<typeof useGoalActions>
  projects: readonly ProjectSummary[]
  project: ProjectSummary | undefined
  available: boolean
}) {
  const { t } = useTranslation()
  const projectActions = useProjectActions()
  const [pending, setPending] = useState<Pending | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const destinations = project
    ? projects.filter(
        (candidate) =>
          candidate.status !== "Archived" &&
          candidate.projectId !== project.projectId
      )
    : []

  const run = (
    rows: readonly GoalRow[],
    destination: ProjectSummary | undefined,
    onDone?: () => void
  ) => {
    if (!project) return
    void actions.removeFromProject(rows, project, destination).then(() => {
      onDone?.()
    })
  }

  const request = (rows: readonly GoalRow[], onDone?: () => void) => {
    if (!project || rows.length === 0) return
    const relocating = rows.filter((row) =>
      isOnlyMemberOf(row, project.projectId)
    ).length
    if (relocating === 0) {
      run(rows, undefined, onDone)
      return
    }
    setPending({ rows: [...rows], relocating, onDone })
    if (destinations.length > 0) setPickerOpen(true)
    else setCreateOpen(true)
  }

  const moveTo = (destination: ProjectSummary) => {
    setPickerOpen(false)
    setCreateOpen(false)
    if (!pending) return
    run(pending.rows, destination, pending.onDone)
    setPending(null)
  }

  const removal: ProjectRemoval | undefined = project
    ? { project, available, request }
    : undefined

  const description =
    pending && pending.rows.length > 1
      ? t("goals.project.moveSelectionDescription", {
          count: pending.relocating,
          project: project?.name,
        })
      : t("goals.project.moveToProjectDescription")

  const dialogs = project ? (
    <>
      <ProjectPickerDialog
        description={description}
        onCreateNew={() => {
          setPickerOpen(false)
          setCreateOpen(true)
        }}
        onOpenChange={setPickerOpen}
        onSelect={moveTo}
        open={pickerOpen}
        pending={false}
        projects={destinations}
        title={t("goals.project.moveToProjectTitle")}
      />
      <ManageProjectsSheet
        actions={projectActions}
        onCreated={moveTo}
        onOpenChange={setCreateOpen}
        open={createOpen}
        project={undefined}
      />
    </>
  ) : null

  return { removal, dialogs }
}
