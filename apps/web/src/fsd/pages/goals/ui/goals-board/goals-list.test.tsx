import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@/test/render"
import userEvent from "@testing-library/user-event"

const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

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
    i18n: { resolvedLanguage: "en" },
  }),
}))

const characters = new Map([
  ["hero1", { id: "hero1", name: "Hero One", faction: "Ultramarines" }],
  ["hero2", { id: "hero2", name: "Hero Two", faction: "Ultramarines" }],
])

const mows = new Map([
  ["mow1", { id: "mow1", name: "Stormbird", faction: "Ultramarines" }],
])

vi.mock("@workspace/player-data/queries", () => ({
  getCampaignEventProgress: async () => [],
  getLiveProgress: async () => undefined,
  getCampaignProgress: () => [],
}))

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: () => characters,
  getMowsMap: () => mows,
  getUpgrades: () => [],
  getCampaignBattles: () => [],
  getCampaignDefinitions: () => [],
  getAscensionCostsMap: () => new Map(),
  getUnlockShardCostsMap: () => new Map(),
  getMowUpgradeCosts: () => [],
  getCharacterAbilityCosts: () => [],
}))

import type { GoalRow } from "../../model/shared/types"
import type { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { GoalsList } from ".//goals-list"

const stubActions = {
  setStatus: vi.fn(),
  remove: vi.fn(),
  pendingIds: new Set<string>(),
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
  beforeEach(() => useIsMobileMock.mockReturnValue(false))

  it("hides move buttons when reorder is disabled", async () => {
    render(
      <GoalsList actions={stubActions} reorderEnabled={false} rows={rows} />
    )

    await screen.findByText("Hero One")

    expect(
      screen.queryByTestId("goal-row-move-up-goal-1")
    ).not.toBeInTheDocument()
  })

  it("shows the plan estimate's completion date for a goal with an entry, and no line at all otherwise", async () => {
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
    expect(estimateCells).toHaveLength(1)
    expect(estimateCells[0]).toHaveAttribute("title", "2026-01-06")
  })

  it("renders the formatted completion date and day-count caption identically on desktop and mobile", async () => {
    const estimates = new Map([
      [
        "goal-1",
        { days: 12, date: "2026-09-28", energyTotal: 100, raidsTotal: 10 },
      ],
    ])

    useIsMobileMock.mockReturnValue(false)
    const desktop = render(
      <GoalsList
        actions={stubActions}
        estimates={estimates}
        reorderEnabled={false}
        rows={rows}
      />
    )
    await screen.findByText("Hero One")
    const desktopCell = screen.getAllByTestId("goal-row-estimate")[0]!
    expect(desktopCell).toHaveTextContent("Sep 28")
    expect(desktopCell).toHaveTextContent("goals.estimate.days")
    desktop.unmount()

    useIsMobileMock.mockReturnValue(true)
    render(
      <GoalsList
        actions={stubActions}
        estimates={estimates}
        reorderEnabled={false}
        rows={rows}
      />
    )
    await screen.findByText("Hero One")
    const mobileCell = screen.getAllByTestId("goal-row-estimate")[0]!
    expect(mobileCell).toHaveTextContent("Sep 28")
    expect(mobileCell).toHaveTextContent("goals.estimate.days")
    expect(mobileCell.innerHTML).toBe(desktopCell.innerHTML)
  })

  it.each([false, true])(
    "lists each unavailable material with quantity and reason, and no date (mobile: %s)",
    async (mobile) => {
      useIsMobileMock.mockReturnValue(mobile)
      const estimates = new Map([
        [
          "goal-1",
          {
            status: "Blocked" as const,
            reason: "NoFarmLocation" as const,
            resourceIds: ["upgHpM004" as never],
            actionableResourceIds: [],
            blockers: [
              {
                resourceId: "upgHpM004" as never,
                reason: "NoFarmLocation" as const,
                remaining: 6,
              },
            ],
          },
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

      const list = screen.getAllByTestId("goal-unavailable-materials")[0]!
      expect(list).toHaveTextContent("goals.estimate.unavailableRow")
      expect(screen.queryByTestId("goal-row-estimate")).toBeNull()
    }
  )

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

    const bar = await screen.findByTestId("goal-progress-bar")
    expect(bar).toBeInTheDocument()
    expect(
      screen.getByTestId("goal-progress-bar-potential-fill")
    ).toBeInTheDocument()
    // The desktop Remaining column shows icon chips (energy here), not the prose sentence.
    const remainingColumn = screen.getByTestId("goal-remaining-column")
    expect(remainingColumn).toHaveTextContent("50")
    expect(remainingColumn).not.toHaveTextContent("slots")
    expect(
      within(remainingColumn).getByRole("img", {
        name: /goals.resourceChips.chipLabel/,
      })
    ).toBeInTheDocument()

    fireEvent.click(screen.getByTestId("goal-progress-info-trigger"))
    const explanation = screen.getByTestId("goal-progress-explanation")
    expect(explanation).toHaveTextContent(
      "goals.overview.actualProgressDescription"
    )
    expect(explanation).toHaveTextContent(
      "goals.overview.potentialProgressDescription"
    )
  })

  it.each([
    ["desktop", false],
    ["mobile", true],
  ])(
    "shows a Rank goal's own level requirement under its progress on %s, with no separate Level row",
    async (_layout, mobile) => {
      useIsMobileMock.mockReturnValue(mobile)
      const metrics = new Map([
        [
          "goal-1",
          {
            progress: {
              kind: "Rank",
              current: "Stone1",
              target: "Iron1",
              ratio: 0.25,
              reachableRatio: null,
            },
            remaining: null,
            blockers: { isBlocked: false, reasons: [] },
            levelRequirement: {
              kind: "LevelRequirement",
              current: 31,
              target: 32,
              ratio: 30 / 31,
              reachableRatio: null,
              reachableLevel: null,
              remainingXp: 12_200,
            },
          },
        ],
      ])
      render(
        <GoalsList
          actions={stubActions}
          levelChargedXp={new Map([["goal-1", 12_200]])}
          levelPoolXpAvailable={new Map([["goal-1", 100_000]])}
          levelPotentialProgress={new Map([["goal-1", 1]])}
          metrics={metrics as never}
          reorderEnabled={false}
          rows={rows}
          xpBookRarity="Legendary"
        />
      )

      // Only goal-1 (the one below its level) shows the requirement; goal-2 has none.
      const lines = await screen.findAllByTestId("level-requirement-line")
      expect(lines).toHaveLength(1)
      expect(screen.getAllByTestId("level-requirement-progress")).toHaveLength(
        1
      )
      // The level target and the book figure (100,000 XP pool / 12,500 per Legendary book = 8
      // available, 12,200 charged XP = 1 needed) share the one line, once each.
      expect(lines[0]).toHaveTextContent("goals.overview.levelProgress")
      expect(screen.getAllByTestId("level-requirement-books")).toHaveLength(1)
      expect(lines[0]).toHaveTextContent("goals.resourceChips.xpBooksValue")
      // Nothing about the requirement in the Remaining chips or Goal cell.
      expect(
        screen.queryAllByTestId("level-requirement-remaining")
      ).toHaveLength(0)
      expect(screen.queryAllByTestId("goal-resource-chip")).toHaveLength(0)
      expect(lines[0]).not.toHaveTextContent("remainingText.levels")
      expect(screen.queryAllByTestId("level-goal-sub-target")).toHaveLength(0)
      // Ordinary progress, never a restriction.
      expect(screen.queryAllByTestId("goal-restricted-indicator")).toHaveLength(
        0
      )
      expect(screen.queryAllByTestId("goal-blocked-indicator")).toHaveLength(0)
    }
  )

  it.each([
    ["desktop row", false],
    ["mobile card", true],
  ])(
    "opens the editor via keyboard from the %s's Edit action",
    async (_layout, mobile) => {
      useIsMobileMock.mockReturnValue(mobile)
      const onEdit = vi.fn()
      const user = userEvent.setup()
      render(
        <GoalsList
          actions={stubActions}
          onEdit={onEdit}
          reorderEnabled={false}
          rows={[rows[0]!]}
        />
      )

      const edit = await screen.findByRole("button", {
        name: "goals.edit.title",
      })
      const row = screen.getByTestId("goal-row")
      expect(row).not.toHaveAttribute("tabindex")
      edit.focus()
      expect(edit).toHaveFocus()
      await user.keyboard("{Enter}")

      expect(onEdit).toHaveBeenCalledWith("goal-1")
    }
  )

  it.each([
    ["desktop row", false],
    ["mobile card", true],
  ])(
    "opens nothing when the goal name or the %s is clicked",
    async (_layout, mobile) => {
      useIsMobileMock.mockReturnValue(mobile)
      const onEdit = vi.fn()
      const user = userEvent.setup()
      render(
        <GoalsList
          actions={stubActions}
          onEdit={onEdit}
          reorderEnabled={false}
          rows={[rows[0]!]}
        />
      )

      await user.click(await screen.findByText("Hero One"))
      await user.click(screen.getByTestId("goal-row"))

      expect(screen.queryByRole("button", { name: "Hero One" })).toBeNull()
      expect(onEdit).not.toHaveBeenCalled()
    }
  )

  it("does not open the editor when Enter is pressed on another row action", async () => {
    const onEdit = vi.fn()
    render(
      <GoalsList
        actions={stubActions}
        onEdit={onEdit}
        reorderEnabled={false}
        rows={[rows[0]!]}
      />
    )

    const trigger = await screen.findByTestId("goal-row-delete-goal-1")
    fireEvent.keyDown(trigger, { key: "Enter" })

    expect(onEdit).not.toHaveBeenCalled()
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

  describe("account-wide priority number", () => {
    const numbers = () =>
      screen.queryAllByTestId("goal-row-priority").map((n) => n.textContent)
    const withStatus = (row: GoalRow, status: GoalRow["status"]): GoalRow => ({
      ...row,
      status,
    })

    it("shows each in-flight row's own position, not its index among the visible rows", async () => {
      // A filtered/grouped/project view of the account order A,B,C,D,E holding A, C and E.
      const view: GoalRow[] = [
        { ...rows[0]!, priority: 1 },
        { ...rows[1]!, goalId: "goal-3", priority: 3 },
        { ...rows[1]!, goalId: "goal-5", priority: 5 },
      ]
      render(<GoalsList actions={stubActions} reorderEnabled rows={view} />)
      await screen.findByText("Hero One")

      expect(numbers()).toEqual([
        "goals.columns.priority 1",
        "goals.columns.priority 3",
        "goals.columns.priority 5",
      ])
      // The number sits in the same leading cell as the drag handle, not in a data column (Character, Projects, Goal, Progress, Remaining, Status, Actions).
      const cell = screen.getAllByTestId("goal-row-priority")[0]!.closest("td")!
      expect(cell).toContainElement(
        screen.getAllByTestId("goal-row-drag-handle")[0]!
      )
      expect(screen.getAllByRole("columnheader")).toHaveLength(8)
    })

    it("shows the number for a Paused row and none for Reached, Completed, Archived or position-less rows", async () => {
      const view: GoalRow[] = [
        { ...rows[0]!, goalId: "paused", status: "Paused", priority: 2 },
        { ...withStatus(rows[0]!, "Completed"), goalId: "done" },
        { ...withStatus(rows[0]!, "Archived"), goalId: "old" },
        { ...rows[0]!, goalId: "none", priority: undefined },
      ]
      render(<GoalsList actions={stubActions} reorderEnabled rows={view} />)
      await screen.findAllByText("Hero One")

      expect(numbers()).toEqual(["goals.columns.priority 2"])
      expect(screen.getAllByTestId("goal-row-drag-handle")).toHaveLength(2)
    })

    it("uses text-foreground, a theme token that meets text contrast in both themes", async () => {
      render(<GoalsList actions={stubActions} reorderEnabled rows={rows} />)
      await screen.findByText("Hero One")

      expect(screen.getAllByTestId("goal-row-priority")[0]).toHaveClass(
        "text-foreground"
      )
    })

    it("still shows the number without a drag handle when the list is not reorderable", async () => {
      render(<GoalsList actions={stubActions} rows={[rows[0]!]} />)
      await screen.findByText("Hero One")

      expect(numbers()).toEqual(["goals.columns.priority 10"])
      expect(screen.queryByTestId("goal-row-drag-handle")).toBeNull()
    })

    it("shows the number in the mobile card header and in the mobile reorder cards", async () => {
      useIsMobileMock.mockReturnValue(true)
      const view: GoalRow[] = [
        rows[0]!,
        { ...withStatus(rows[1]!, "Completed"), priority: undefined },
      ]
      const { unmount } = render(
        <GoalsList actions={stubActions} reorderEnabled rows={view} />
      )
      await screen.findByText("Hero One")
      expect(numbers()).toEqual(["goals.columns.priority 10"])
      unmount()

      render(
        <GoalsList
          actions={stubActions}
          mobileReorderActive
          reorderEnabled
          rows={view}
        />
      )
      await screen.findByText("Hero One")
      expect(numbers()).toEqual(["goals.columns.priority 10"])
      expect(screen.getAllByTestId("goal-row-reorder-card")).toHaveLength(1)
    })

    it("names a row's state in text and its drag handle by name, in the table and in the mobile reorder cards", async () => {
      const view: GoalRow[] = [
        { ...rows[0]!, goalId: "paused", status: "Paused", priority: 2 },
      ]
      const { unmount } = render(
        <GoalsList actions={stubActions} reorderEnabled rows={view} />
      )
      await screen.findByText("Hero One")
      expect(screen.getByTestId("goal-status-badge")).toHaveTextContent(
        "goals.status.Paused"
      )
      expect(screen.getByTestId("goal-row-drag-handle")).toHaveAccessibleName(
        "goals.columns.reorderHandle"
      )
      unmount()

      useIsMobileMock.mockReturnValue(true)
      render(
        <GoalsList
          actions={stubActions}
          mobileReorderActive
          reorderEnabled
          rows={view}
        />
      )
      await screen.findByText("Hero One")
      // The reorder card shows only in-flight rows, so without its own badge a Paused card would be
      // indistinguishable from an Active one.
      const card = screen.getByTestId("goal-row-reorder-card")
      expect(card).toHaveTextContent("goals.status.Paused")
      expect(screen.getByTestId("goal-row-drag-handle")).toHaveAccessibleName(
        "goals.columns.reorderHandle"
      )
    })

    it("marks a dragged row without lowering its opacity, so its text keeps its contrast", async () => {
      render(<GoalsList actions={stubActions} reorderEnabled rows={rows} />)
      await screen.findByText("Hero One")

      const row = screen.getAllByTestId("goal-row")[0]!
      expect(row.className).not.toMatch(/opacity/)
      expect(row).toHaveClass("data-[dragging]:bg-card")
    })
  })
})

describe("GoalsList reached rows and column layout", () => {
  beforeEach(() => useIsMobileMock.mockReturnValue(false))

  const rankMetrics = (goalId: string) =>
    new Map([
      [
        goalId,
        {
          progress: {
            kind: "Rank",
            current: "Stone1",
            target: "Iron1",
            ratio: 0.25,
            reachableRatio: null,
            targetSlots: 3,
          },
          remaining: null,
          blockers: { isBlocked: false, reasons: [] },
        },
      ],
    ]) as never
  const estimates = new Map([
    ["goal-1", { days: 5, date: "2026-01-06", energyTotal: 50, raidsTotal: 5 }],
  ])

  it.each([
    ["desktop", false],
    ["mobile", true],
  ])(
    "shows no XP-book chip on a reached goal on %s",
    async (_layout, mobile) => {
      useIsMobileMock.mockReturnValue(mobile)
      render(
        <GoalsList
          actions={stubActions}
          levelChargedXp={new Map([["goal-1", 12_200]])}
          levelPoolXpAvailable={new Map([["goal-1", 100_000]])}
          metrics={rankMetrics("goal-1")}
          reachedByGoalId={new Map([["goal-1", true]])}
          reorderEnabled={false}
          rows={[rows[0]!]}
          xpBookRarity="Legendary"
        />
      )

      await screen.findByTestId("goal-row")
      expect(screen.queryByTestId("goal-resource-chips")).toBeNull()
    }
  )

  it.each([
    ["desktop", false],
    ["mobile", true],
  ])(
    "renders a reached Paused goal as a completed %s row with dashes and no pause/resume",
    async (_layout, mobile) => {
      useIsMobileMock.mockReturnValue(mobile)
      const paused: GoalRow = { ...rows[0]!, status: "Paused" }
      render(
        <GoalsList
          actions={stubActions}
          estimates={estimates}
          metrics={rankMetrics("goal-1")}
          reachedByGoalId={new Map([["goal-1", true]])}
          reorderEnabled={false}
          rows={[paused]}
        />
      )

      const row = await screen.findByTestId("goal-row")
      expect(row).toHaveClass("bg-success")
      expect(screen.getByTestId("goal-status-badge")).toHaveTextContent(
        "goals.status.Reached"
      )
      expect(screen.queryByText("goals.status.Paused")).toBeNull()
      expect(screen.queryByTestId("goal-progress")).toBeNull()
      expect(screen.queryByTestId("goal-row-estimate")).toBeNull()
      expect(screen.queryByTestId("goal-remaining-column")).toBeNull()
      expect(screen.getAllByTestId("goal-reached-dash").length).toBeGreaterThan(
        0
      )
      expect(screen.queryByTestId("goal-row-resume-goal-1")).toBeNull()
      expect(stubActions.setStatus).not.toHaveBeenCalled()
      // The Goal cell/line renders as for any other goal.
      expect(screen.getByAltText("Iron1")).toBeInTheDocument()
    }
  )

  it("shows dashes for progress, remaining and done-by in the three desktop cells of a reached row", async () => {
    render(
      <GoalsList
        actions={stubActions}
        estimates={estimates}
        metrics={rankMetrics("goal-1")}
        reachedByGoalId={new Map([["goal-1", true]])}
        reorderEnabled={false}
        rows={[rows[0]!]}
      />
    )
    await screen.findByTestId("goal-row")
    expect(screen.getAllByTestId("goal-reached-dash")).toHaveLength(3)
  })

  it("leaves a not-reached row untinted with its own status and progress", async () => {
    render(
      <GoalsList
        actions={stubActions}
        metrics={rankMetrics("goal-1")}
        reachedByGoalId={new Map([["goal-1", false]])}
        reorderEnabled={false}
        rows={[rows[0]!]}
      />
    )
    const row = await screen.findByTestId("goal-row")
    expect(row).not.toHaveClass("bg-success")
    expect(screen.getByTestId("goal-status-badge")).toHaveTextContent(
      "goals.status.Active"
    )
    expect(screen.queryByTestId("goal-reached-dash")).toBeNull()
  })

  it("has no goal-type caption and no overflow menu on a desktop row", async () => {
    render(
      <GoalsList actions={stubActions} reorderEnabled={false} rows={rows} />
    )
    await screen.findByText("Hero One")
    expect(screen.queryByText("goals.create.goalTypes.Rank")).toBeNull()
    expect(screen.queryByTestId("goal-row-actions-trigger-goal-1")).toBeNull()
  })

  it("puts Projects between Character and Goal, holding the badges, and keeps them out of the Character cell", async () => {
    const withProjects: GoalRow = {
      ...rows[0]!,
      priority: undefined,
      projects: [
        { projectId: "p1", name: "My Goals", color: null },
        { projectId: "p2", name: "Neuro", color: null },
      ],
    }
    render(
      <GoalsList
        actions={stubActions}
        reorderEnabled={false}
        rows={[withProjects, { ...rows[1]!, priority: undefined }]}
      />
    )
    await screen.findByText("Hero One")

    expect(
      screen.getAllByRole("columnheader").map((h) => h.textContent)
    ).toEqual([
      "goals.columns.entity",
      "goals.columns.projects",
      "goals.columns.goal",
      "goals.columns.progress",
      "goals.columns.remaining",
      "goals.columns.status",
      "goals.columns.actions",
    ])
    const [first, second] = screen.getAllByTestId("goal-row")
    const cells = first!.querySelectorAll("td")
    expect(cells).toHaveLength(7)
    expect(cells[0]).not.toContainElement(
      screen.getAllByTestId("goal-project-memberships")[0]!
    )
    expect(cells[1]).toHaveTextContent("My Goals")
    expect(cells[1]).toHaveTextContent("Neuro")
    // A goal in no project: empty cell, same alignment.
    expect(second!.querySelectorAll("td")).toHaveLength(7)
    expect(second!.querySelectorAll("td")[1]!.textContent).toBe("")
  })

  it("renders notes on one truncated line under the name, with the full text as a tooltip", async () => {
    const long = "some very long note ".repeat(10)
    render(
      <GoalsList
        actions={stubActions}
        reorderEnabled={false}
        rows={[{ ...rows[0]!, notes: long }]}
      />
    )
    const notes = await screen.findByTestId("goal-row-notes")
    expect(notes).toHaveClass("truncate")
    expect(notes).toHaveAttribute("title", long)
    // Directly beneath the name, in the same block.
    expect(notes.previousElementSibling).toContainElement(
      screen.getByText("Hero One")
    )
  })

  it("keeps the mobile card's notes line and project badges, with the Unlock word once and its count", async () => {
    useIsMobileMock.mockReturnValue(true)
    render(
      <GoalsList
        actions={stubActions}
        metrics={
          new Map([
            [
              "goal-1",
              {
                progress: {
                  kind: "Unlock",
                  owned: 329,
                  required: 500,
                  ratio: 0.66,
                },
                remaining: null,
                blockers: { isBlocked: false, reasons: [] },
              },
            ],
          ]) as never
        }
        reorderEnabled={false}
        rows={[
          {
            ...rows[0]!,
            goalType: "Unlock",
            notes: "card note",
            projects: [{ projectId: "p1", name: "My Goals", color: null }],
          },
        ]}
      />
    )
    const card = await screen.findByTestId("goal-row")
    expect(card).toHaveTextContent("card note")
    expect(card).toHaveTextContent("My Goals")
    expect(screen.getAllByText("goals.create.goalTypes.Unlock")).toHaveLength(1)
    expect(screen.getByTestId("goal-unlock-count")).toHaveTextContent(
      "goals.overview.ownedOfRequired"
    )
  })
})

describe("GoalsList remaining chips on mobile", () => {
  const chipMetrics = new Map([
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
  ])
  const estimates = new Map([
    [
      "goal-1",
      { days: 5, date: "2026-01-06", energyTotal: 1674, raidsTotal: 5 },
    ],
  ])

  it("shows chips on the card and dashes (no chips) once reached", async () => {
    useIsMobileMock.mockReturnValue(true)
    const { unmount } = render(
      <GoalsList
        actions={stubActions}
        estimates={estimates as never}
        metrics={chipMetrics as never}
        reorderEnabled={false}
        rows={[rows[0]!]}
      />
    )
    await screen.findByText("Hero One")
    expect(screen.getByTestId("goal-resource-chips")).toHaveTextContent("1,674")
    unmount()

    render(
      <GoalsList
        actions={stubActions}
        estimates={estimates as never}
        metrics={chipMetrics as never}
        reachedByGoalId={new Map([["goal-1", true]])}
        reorderEnabled={false}
        rows={[rows[0]!]}
      />
    )
    await screen.findByText("Hero One")
    expect(screen.queryByTestId("goal-resource-chips")).toBeNull()
  })
})
