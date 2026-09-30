import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { render, screen } from "@/test/render"

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) =>
      opts?.count === undefined ? key : `${key}:${opts.count}`,
  }),
}))

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
    for (const key of ["pause", "resume", "addToProject", "delete"]) {
      const button = screen.getByTestId(`goals-bulk-${key}`)
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent(`goals.bulk.${key}`)
      expect(button).not.toHaveTextContent(":")
    }
  })

  it("enables Resume with the paused count and leaves Pause disabled for two Paused goals", () => {
    setup([row("a", "Paused"), row("b", "Paused")])
    expect(screen.getByTestId("goals-bulk-resume")).toHaveTextContent(
      "goals.bulk.resumeCount:2"
    )
    expect(screen.getByTestId("goals-bulk-resume")).toBeEnabled()
    expect(screen.getByTestId("goals-bulk-pause")).toBeDisabled()
    expect(screen.getByTestId("goals-bulk-delete")).toHaveTextContent(
      "goals.bulk.deleteCount:2"
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
})
