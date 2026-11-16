import { useState } from "react"

import type { ProjectSummary } from "@/entities/project"
import {
  ManageProjectsSheet,
  useProjectActions,
} from "@/features/project-management"

import type { useGoalActions, GoalRow } from "@/features/goal-planning"
import { DeleteGoalDialog } from "./delete-goal-dialog"
import { GoalsBulkActions } from "./goals-bulk-actions"
import { ProjectMultiPickerDialog } from "./project-multi-picker-dialog"
import type { ProjectRemoval } from "./project-removal-flow"

type Props = {
  selectedRows: readonly GoalRow[]
  reachedByGoalId?: ReadonlyMap<string, boolean>
  actions: ReturnType<typeof useGoalActions>
  projects: readonly ProjectSummary[]
  /** Discards the selection once an action has finished (or, for Delete, been confirmed). */
  clearSelection: () => void
  compact?: boolean
  /** Present while the page is scoped to a project; adds bulk "Remove from project". */
  projectRemoval?: ProjectRemoval
}

/** The bulk actions plus what they open: the delete confirmation and the Add-to-project multi-select
 *  destination picker (or project creation when no non-archived project exists). Remove from project goes through
 *  the page's shared `projectRemoval` flow, whose destination picker the page renders once. Mounted once
 *  per platform — in the desktop actions row or the mobile select bar — so the flows cannot drift. */
export function GoalsBulkControls({
  selectedRows,
  reachedByGoalId,
  actions,
  projects,
  clearSelection,
  compact,
  projectRemoval,
}: Props) {
  const projectActions = useProjectActions()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const choosable = projects.filter((project) => project.status !== "Archived")

  const addSelectionTo = (destinations: ProjectSummary[]) => {
    setPickerOpen(false)
    setCreateOpen(false)
    void actions.addToProjects(selectedRows, destinations).then(clearSelection)
  }

  return (
    <>
      <GoalsBulkActions
        compact={compact}
        onAddToProject={() =>
          choosable.length > 0 ? setPickerOpen(true) : setCreateOpen(true)
        }
        onDelete={() => setDeleteOpen(true)}
        onRemoveFromProject={(rows) =>
          projectRemoval?.request(rows, clearSelection)
        }
        onPause={(targets) =>
          void actions.setStatusMany(targets, "Paused").then(clearSelection)
        }
        onResume={(targets) =>
          void actions.setStatusMany(targets, "Active").then(clearSelection)
        }
        pendingIds={actions.pendingIds}
        projectRemoval={projectRemoval}
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
        projectName={projectRemoval?.project.name}
      />
      {pickerOpen ? (
        <ProjectMultiPickerDialog
          onConfirm={addSelectionTo}
          onCreateNew={() => {
            setPickerOpen(false)
            setCreateOpen(true)
          }}
          onOpenChange={setPickerOpen}
          projects={choosable}
        />
      ) : null}
      <ManageProjectsSheet
        actions={projectActions}
        onCreated={(project) => addSelectionTo([project])}
        onOpenChange={setCreateOpen}
        open={createOpen}
        project={undefined}
      />
    </>
  )
}
