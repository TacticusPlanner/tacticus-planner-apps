import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { render, screen } from "@/test/render"

import type { GoalRow } from "../../model/shared/types"
import { GoalsBulkActions } from ".//goals-bulk-actions"

const row = (goalId: string, status: GoalRow["status"]): GoalRow => ({
  goalId,
  entityType: "Character",
  entityId: "hero1",
  goalType: "Rank",
  status,
  notes: null,
  updatedAt: "2026-01-01T00:00:00Z",
})

function setup(
  selectedRows: GoalRow[],
  extra: {
    reached?: Record<string, boolean>
    pending?: string[]
  } = {}
) {
  const handlers = {
    onPause: vi.fn(),
    onResume: vi.fn(),
    onAddToProject: vi.fn(),
    onDelete: vi.fn(),
  }
  render(
    <GoalsBulkActions
      {...handlers}
      pendingIds={new Set(extra.pending)}
      reachedByGoalId={new Map(Object.entries(extra.reached ?? {}))}
      selectedRows={selectedRows}
    />
  )
  return handlers
}

describe("GoalsBulkActions", () => {
  it("disables every action with no count when nothing is selected", () => {
    setup([])
    for (const [key, label] of [
      ["pause", "Pause"],
      ["resume", "Resume"],
      ["addToProject", "Add to project"],
      ["delete", "Delete"],
    ]) {
      const button = screen.getByTestId(`goals-bulk-${key}`)
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent(label)
      expect(button).not.toHaveTextContent("(")
    }
  })

  it("enables Resume with the paused count and leaves Pause disabled for two Paused goals", () => {
    setup([row("a", "Paused"), row("b", "Paused")])
    expect(screen.getByTestId("goals-bulk-resume")).toHaveTextContent(
      "Resume (2)"
    )
    expect(screen.getByTestId("goals-bulk-resume")).toBeEnabled()
    expect(screen.getByTestId("goals-bulk-pause")).toBeDisabled()
    expect(screen.getByTestId("goals-bulk-delete")).toHaveTextContent(
      "Delete (2)"
    )
  })

  it("pauses only Active, non-reached, non-pending goals of a mixed selection", async () => {
    const user = userEvent.setup()
    const handlers = setup(
      [
        row("active-1", "Active"),
        row("active-2", "Active"),
        row("active-reached", "Active"),
        row("active-busy", "Active"),
        row("paused", "Paused"),
      ],
      { reached: { "active-reached": true }, pending: ["active-busy"] }
    )

    await user.click(screen.getByTestId("goals-bulk-pause"))

    expect(handlers.onPause).toHaveBeenCalledExactlyOnceWith([
      { goalId: "active-1", previousStatus: "Active" },
      { goalId: "active-2", previousStatus: "Active" },
    ])
  })

  describe("while scoped to a project", () => {
    const removal = (available = true) => ({
      project: { projectId: "p1", name: "Proj" } as never,
      available,
      request: vi.fn(),
    })
    const member = (goalId: string, projectIds?: string[]): GoalRow => ({
      ...row(goalId, "Active"),
      ...(projectIds
        ? { projects: projectIds.map((projectId) => ({ projectId })) as never }
        : {}),
    })

    it("is absent when the page is not scoped", () => {
      setup([row("a", "Active")])
      expect(screen.queryByTestId("goals-bulk-removeFromProject")).toBeNull()
    })

    it("counts and acts on the selected goals whose memberships are known", async () => {
      const onRemoveFromProject = vi.fn()
      const rows = [member("a", ["p1"]), member("b", ["p1", "p2"]), member("c")]
      render(
        <GoalsBulkActions
          onAddToProject={vi.fn()}
          onDelete={vi.fn()}
          onPause={vi.fn()}
          onRemoveFromProject={onRemoveFromProject}
          onResume={vi.fn()}
          pendingIds={new Set()}
          projectRemoval={removal()}
          selectedRows={rows}
        />
      )
      const button = screen.getByTestId("goals-bulk-removeFromProject")
      expect(button).toHaveTextContent("Remove from project (2)")
      await userEvent.setup().click(button)
      expect(onRemoveFromProject).toHaveBeenCalledWith([rows[0], rows[1]])
    })

    it("is disabled while the destinations are not loaded", () => {
      render(
        <GoalsBulkActions
          onAddToProject={vi.fn()}
          onDelete={vi.fn()}
          onPause={vi.fn()}
          onRemoveFromProject={vi.fn()}
          onResume={vi.fn()}
          pendingIds={new Set()}
          projectRemoval={removal(false)}
          selectedRows={[member("a", ["p1"])]}
        />
      )
      expect(screen.getByTestId("goals-bulk-removeFromProject")).toBeDisabled()
    })
  })
})
