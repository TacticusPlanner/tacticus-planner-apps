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

const mows = new Map([
  ["mow1", { id: "mow1", name: "Stormbird", faction: "Ultramarines" }],
])

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: () => characters,
  getMowsMap: () => mows,
  getUpgrades: () => [],
  getCampaignBattles: () => [],
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
    milestonesTotal: 0,
    milestonesCompleted: 0,
  },
  {
    goalId: "goal-2",
    entityType: "Character",
    entityId: "hero2",
    goalType: "Rank",
    status: "Active",
    priority: 20,
    milestonesTotal: 0,
    milestonesCompleted: 0,
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

  it("shows the plan estimate's completion date for a goal with an entry, and the placeholder otherwise", async () => {
    const estimates = new Map([
      [
        "goal-1",
        { days: 5, date: "2026-01-06", energyTotal: 50, raidsTotal: 5 },
      ],
    ])
    render(
      <GoalsList
        actions={stubActions}
        estimates={estimates}
        reorderEnabled={false}
        rows={rows}
      />
    )

    await screen.findByText("Hero One")

    const estimateCells = screen.getAllByTestId("goal-row-estimate")
    expect(estimateCells[0]).toHaveAttribute("title", "2026-01-06")
    expect(estimateCells[1]).not.toHaveAttribute("title")
  })

  it("renders the placeholder for every row when no estimates are given", async () => {
    render(
      <GoalsList actions={stubActions} reorderEnabled={false} rows={rows} />
    )

    await screen.findByText("Hero One")

    for (const cell of screen.getAllByTestId("goal-row-estimate")) {
      expect(cell).not.toHaveAttribute("title")
    }
  })

  it("shows a milestones badge only for a row with milestonesTotal > 0", async () => {
    const rowsWithMilestones: GoalRow[] = [
      { ...rows[0], milestonesTotal: 4, milestonesCompleted: 1 },
      rows[1],
    ]
    render(
      <GoalsList
        actions={stubActions}
        reorderEnabled={false}
        rows={rowsWithMilestones}
      />
    )

    await screen.findByText("Hero One")

    expect(screen.getAllByTestId("goal-row-milestones")).toHaveLength(1)
  })

  it("resolves a Machine of War row's display name from the mows catalog", async () => {
    const mowRows: GoalRow[] = [
      {
        goalId: "goal-3",
        entityType: "Mow",
        entityId: "mow1",
        goalType: "Ability",
        status: "Active",
        priority: 10,
        milestonesTotal: 0,
        milestonesCompleted: 0,
      },
    ]
    render(
      <GoalsList actions={stubActions} reorderEnabled={false} rows={mowRows} />
    )

    expect(await screen.findByText("Stormbird")).toBeInTheDocument()
  })
})
