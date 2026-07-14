import { useEffect, useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (
    querier: () => unknown,
    deps: unknown[] = [],
    defaultResult?: unknown
  ) => {
    const [value, setValue] = useState<unknown>(defaultResult)
    useEffect(() => {
      const result = querier()
      if (result instanceof Promise) {
        let active = true
        void result.then((resolved) => {
          if (active) setValue(resolved)
        })
        return () => {
          active = false
        }
      }
      setValue(result)
      return undefined
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}))

const characters = new Map([
  ["hero1", { id: "hero1", name: "Hero One", faction: "Ultramarines" }],
  ["hero2", { id: "hero2", name: "Hero Two", faction: "Ultramarines" }],
])

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: () => characters,
  getUpgrades: () => [],
}))

import type { GoalRow } from "../model/types"
import type { useGoalActions } from "../model/use-goal-actions"
import { GoalsList } from "./goals-list"

const stubActions = {
  setStatus: vi.fn(),
  remove: vi.fn(),
  pendingId: null,
} as unknown as ReturnType<typeof useGoalActions>

const rows: GoalRow[] = [
  {
    goalId: "goal-1",
    entityType: "Character",
    entityId: "hero1",
    goalType: "Rank",
    status: "Active",
    priority: 10,
  },
  {
    goalId: "goal-2",
    entityType: "Character",
    entityId: "hero2",
    goalType: "Rank",
    status: "Active",
    priority: 20,
  },
]

describe("GoalsList", () => {
  it("calls onMove with the correct direction when a move button is clicked", async () => {
    const onMove = vi.fn()
    render(
      <GoalsList
        actions={stubActions}
        onMove={onMove}
        reorderEnabled
        rows={rows}
      />
    )

    expect(await screen.findByText("Hero One")).toBeInTheDocument()

    fireEvent.click(screen.getByTestId("goal-row-move-down-goal-1"))
    expect(onMove).toHaveBeenCalledWith("goal-1", "down")

    fireEvent.click(screen.getByTestId("goal-row-move-up-goal-2"))
    expect(onMove).toHaveBeenCalledWith("goal-2", "up")
  })

  it("disables move-up on the first row and move-down on the last row", async () => {
    render(
      <GoalsList
        actions={stubActions}
        onMove={vi.fn()}
        reorderEnabled
        rows={rows}
      />
    )

    await screen.findByText("Hero One")

    expect(screen.getByTestId("goal-row-move-up-goal-1")).toBeDisabled()
    expect(screen.getByTestId("goal-row-move-down-goal-2")).toBeDisabled()
  })

  it("hides move buttons when reorder is disabled", async () => {
    render(
      <GoalsList actions={stubActions} reorderEnabled={false} rows={rows} />
    )

    await screen.findByText("Hero One")

    expect(
      screen.queryByTestId("goal-row-move-up-goal-1")
    ).not.toBeInTheDocument()
  })
})
