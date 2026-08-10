import { useEffect, useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

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
  initReactI18next: { type: "3rdParty", init: vi.fn() },
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
  getCampaignDefinitions: () => [],
  getAscensionCostsMap: () => new Map(),
  getUnlockShardCostsMap: () => new Map(),
}))

import type { GoalRow } from "../../model/shared/types"
import type { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { GoalsList } from ".//goals-list"

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
    notes: null,
    updatedAt: "2026-07-15T00:00:00Z",
  },
  {
    goalId: "goal-2",
    entityType: "Character",
    entityId: "hero2",
    goalType: "Rank",
    status: "Active",
    priority: 20,
    notes: null,
    updatedAt: "2026-07-15T00:00:00Z",
  },
]

describe("GoalsList", () => {
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

  it("renders no estimate column when no estimates are given", async () => {
    render(
      <GoalsList actions={stubActions} reorderEnabled={false} rows={rows} />
    )

    await screen.findByText("Hero One")

    expect(screen.queryAllByTestId("goal-row-estimate")).toHaveLength(0)
  })

  it("renders separate actual and potential progress for a project-scoped goal", async () => {
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
        metrics={
          new Map([
            [
              "goal-1",
              {
                progress: {
                  kind: "Rank",
                  current: "Stone1",
                  target: "Iron1",
                  ratio: 0.25,
                },
                remaining: {
                  upgrades: [],
                  shardId: null,
                  shards: 0,
                  mythicShards: 0,
                  orbsByType: {},
                  upgradeSlotsRemaining: 3,
                },
                blockers: { isBlocked: false, reasons: [] },
              },
            ],
          ]) as never
        }
        potentialProgress={new Map([["goal-1", 0.75]])}
        reorderEnabled={false}
        rows={[rows[0]!]}
      />
    )

    expect(await screen.findByTestId("goal-progress-bar")).toHaveAttribute(
      "aria-valuetext",
      "25%"
    )
    expect(screen.getByTestId("goal-potential-progress-bar")).toHaveAttribute(
      "aria-valuetext",
      "75%"
    )
    const actualSummary = screen.getByTestId("goal-remaining-summary")
    const potentialSummary = screen.getByTestId("goal-energy-remaining-summary")
    expect(actualSummary).toHaveTextContent(
      "goals.overview.remaining.upgradeSlots"
    )
    expect(potentialSummary).toHaveTextContent(
      "goals.overview.remaining.energy"
    )
    expect(
      screen
        .getByTestId("goal-progress-bar")
        .compareDocumentPosition(actualSummary) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      screen
        .getByTestId("goal-potential-progress-bar")
        .compareDocumentPosition(potentialSummary) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("opens the goal detail via keyboard from the goal-name button", async () => {
    const onView = vi.fn()
    const user = userEvent.setup()
    render(
      <GoalsList
        actions={stubActions}
        onView={onView}
        reorderEnabled={false}
        rows={[rows[0]!]}
      />
    )

    const nameButton = await screen.findByRole("button", { name: "Hero One" })
    const row = screen.getByTestId("goal-row")
    expect(screen.getByRole("row", { name: /Hero One/ })).toBe(row)
    expect(row).not.toHaveAttribute("tabindex")
    nameButton.focus()
    expect(nameButton).toHaveFocus()
    await user.keyboard("{Enter}")

    expect(onView).toHaveBeenCalledWith("goal-1")
  })

  it("does not open the goal detail when Enter is pressed on the row actions trigger", async () => {
    const onView = vi.fn()
    render(
      <GoalsList
        actions={stubActions}
        onView={onView}
        reorderEnabled={false}
        rows={[rows[0]!]}
      />
    )

    const trigger = await screen.findByTestId("goal-row-actions-trigger-goal-1")
    fireEvent.keyDown(trigger, { key: "Enter" })

    expect(onView).not.toHaveBeenCalled()
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
        notes: null,
        updatedAt: "2026-07-15T00:00:00Z",
      },
    ]
    render(
      <GoalsList actions={stubActions} reorderEnabled={false} rows={mowRows} />
    )

    expect(await screen.findByText("Stormbird")).toBeInTheDocument()
  })
})
