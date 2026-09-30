import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { ProjectSummary } from "@/entities/project"
import {
  ManageProjectsSheet,
  useProjectActions,
} from "@/features/project-management"

import type { useGoalActions } from "../../model/goals-data/use-goal-actions"
import type { GoalRow } from "../../model/shared/types"
import { DeleteGoalDialog } from "./delete-goal-dialog"
import { GoalsBulkActions } from "./goals-bulk-actions"
import { ProjectPickerDialog } from "./project-picker-dialog"

type Props = {
  selectedRows: readonly GoalRow[]
  reachedByGoalId?: ReadonlyMap<string, boolean>
  actions: ReturnType<typeof useGoalActions>
  projects: readonly ProjectSummary[]
  /** Discards the selection once an action has finished (or, for Delete, been confirmed). */
  clearSelection: () => void
  compact?: boolean
}

/** The four bulk actions plus what they open: the delete confirmation and the Add-to-project
 *  destination picker (or project creation when no non-archived project exists). Mounted once per
 *  platform — in the desktop actions row or the mobile select bar — so the flows cannot drift. */
export function GoalsBulkControls({
  selectedRows,
  reachedByGoalId,
  actions,
  projects,
  clearSelection,
  compact,
}: Props) {
  const { t } = useTranslation()
  const projectActions = useProjectActions()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const choosable = projects.filter((project) => project.status !== "Archived")

  const addSelectionTo = (project: ProjectSummary) => {
    setPickerOpen(false)
    setCreateOpen(false)
    void actions.addToProject(selectedRows, project).then(clearSelection)
  }

  return (
    <>
      <GoalsBulkActions
        compact={compact}
        onAddToProject={() =>
          choosable.length > 0 ? setPickerOpen(true) : setCreateOpen(true)
        }
        onDelete={() => setDeleteOpen(true)}
        onPause={(targets) =>
          void actions.setStatusMany(targets, "Paused").then(clearSelection)
        }
        onResume={(targets) =>
          void actions.setStatusMany(targets, "Active").then(clearSelection)
        }
        pendingIds={actions.pendingIds}
        reachedByGoalId={reachedByGoalId}
        selectedRows={selectedRows}
      />
      <DeleteGoalDialog
        count={selectedRows.length}
        onConfirm={() => {
          const ids = selectedRows.map((row) => row.goalId)
          setDeleteOpen(false)
          clearSelection()
          void actions.removeMany(ids)
        }}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        pending={false}
      />
      <ProjectPickerDialog
        description={t("goals.project.addToProjectDescription")}
        onCreateNew={() => {
          setPickerOpen(false)
          setCreateOpen(true)
        }}
        onOpenChange={setPickerOpen}
        onSelect={addSelectionTo}
        open={pickerOpen}
        pending={false}
        projects={choosable as ProjectSummary[]}
        title={t("goals.project.addToProjectTitle")}
      />
      <ManageProjectsSheet
        actions={projectActions}
        onCreated={addSelectionTo}
        onOpenChange={setCreateOpen}
        open={createOpen}
        project={undefined}
      />
    </>
  )
}
