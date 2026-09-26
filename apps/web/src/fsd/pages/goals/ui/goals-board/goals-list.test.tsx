import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@/test/render"
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
    // The desktop Remaining column shows the same formatted text as the info popover.
    expect(screen.getByTestId("goal-remaining-column")).toHaveTextContent(
      "goals.overview.remainingText.rankWithEnergy"
    )

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
          levelPotentialProgress={new Map([["goal-1", 1]])}
          metrics={metrics as never}
          reorderEnabled={false}
          rows={rows}
        />
      )

      // Only goal-1 (the one below its level) shows the requirement; goal-2 has none.
      expect(
        await screen.findAllByTestId("level-requirement-target")
      ).toHaveLength(1)
      expect(screen.getAllByTestId("level-requirement-progress")).toHaveLength(
        1
      )
      expect(screen.getAllByTestId("level-requirement-remaining")).toHaveLength(
        1
      )
      expect(screen.queryAllByTestId("level-goal-sub-target")).toHaveLength(0)
      // Ordinary progress, never a restriction.
      expect(screen.queryAllByTestId("goal-restricted-indicator")).toHaveLength(
        0
      )
      expect(screen.queryAllByTestId("goal-blocked-indicator")).toHaveLength(0)
    }
  )

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

  it("does not open the goal detail when Enter is pressed on a row action", async () => {
    const onView = vi.fn()
    render(
      <GoalsList
        actions={stubActions}
        onView={onView}
        reorderEnabled={false}
        rows={[rows[0]!]}
      />
    )

    const trigger = await screen.findByTestId("goal-row-delete-goal-1")
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
      // The number sits in the same leading cell as the drag handle, not in a seventh column.
      const cell = screen.getAllByTestId("goal-row-priority")[0]!.closest("td")!
      expect(cell).toContainElement(
        screen.getAllByTestId("goal-row-drag-handle")[0]!
      )
      expect(screen.getAllByRole("columnheader")).toHaveLength(7)
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
  })

  describe("density", () => {
    const estimates = new Map([
      [
        "goal-1",
        { days: 5, date: "2026-01-06", energyTotal: 50, raidsTotal: 5 },
      ],
    ])
    const rankProgress = {
      kind: "Rank",
      current: "Stone1",
      target: "Iron1",
      ratio: 0.25,
      reachableRatio: null,
    }
    const metricsFor = (levelRequirement?: unknown) =>
      new Map([
        [
          "goal-1",
          {
            progress: rankProgress,
            remaining: null,
            blockers: { isBlocked: false, reasons: [] },
            levelRequirement,
          },
        ],
      ]) as never
    const levelRequirement = {
      kind: "LevelRequirement",
      current: 31,
      target: 32,
      ratio: 30 / 31,
      reachableRatio: null,
      reachableLevel: null,
      remainingXp: 12_200,
    }
    // Radix/dnd-kit generate per-mount ids; strip them so two renders can be compared.
    const stable = (html: string) =>
      html.replace(/radix-[\w:-]+|:r\w+:|Dnd\w+-\d+/g, "id")
    const captionFor = () =>
      screen.queryAllByText("goals.create.goalTypes.Rank")

    it.each([[undefined], ["comfortable"] as const])(
      "shows the goal-type caption and Done-by line at Comfortable (density %s)",
      async (density) => {
        render(
          <GoalsList
            actions={stubActions}
            density={density}
            estimates={estimates}
            rows={[rows[0]!]}
          />
        )
        await screen.findByText("Hero One")

        expect(captionFor()).toHaveLength(1)
        expect(screen.getByTestId("goal-row-estimate")).toBeInTheDocument()
        expect(screen.getByTestId("goal-row")).toHaveClass("h-14")
      }
    )

    it("hides the goal-type caption and Done-by line at Compact and uses the shorter row height", async () => {
      render(
        <GoalsList
          actions={stubActions}
          density="compact"
          estimates={estimates}
          rows={[rows[0]!]}
        />
      )
      await screen.findByText("Hero One")

      expect(captionFor()).toHaveLength(0)
      expect(screen.queryByTestId("goal-row-estimate")).toBeNull()
      expect(screen.getByTestId("goal-row")).toHaveClass("h-10")
      expect(screen.getByTestId("goal-row")).not.toHaveClass("h-14")
      // Six data columns plus the leading priority/drag cell, same as Comfortable.
      expect(screen.getAllByRole("columnheader")).toHaveLength(7)
    })

    it("leaves the Goal, Progress, Remaining, status and Actions content unchanged between densities", async () => {
      const contentFor = async (density: "comfortable" | "compact") => {
        const { unmount } = render(
          <GoalsList
            actions={stubActions}
            density={density}
            estimates={estimates}
            metrics={metricsFor()}
            rows={[rows[0]!]}
          />
        )
        await screen.findByText("Hero One")
        const cells = screen.getAllByRole("cell")
        // Cells: 0 leading, 1 Character (caption differs by design), 2 Goal, 3 Progress,
        // 4 Remaining, 5 status (its Done-by line differs; compared by badge), 6 Actions.
        const content = [2, 3, 4, 6].map((i) => stable(cells[i]!.innerHTML))
        const badge = cells[5]!.querySelector(
          '[data-testid="goal-status-badge"]'
        )
        const result = { content, badge: badge?.outerHTML }
        unmount()
        return result
      }

      const comfortable = await contentFor("comfortable")
      const compact = await contentFor("compact")
      expect(compact.content).toEqual(comfortable.content)
      expect(compact.badge).toEqual(comfortable.badge)
    })

    it("keeps the priority number and drag handle at Compact", async () => {
      render(
        <GoalsList
          actions={stubActions}
          density="compact"
          reorderEnabled
          rows={rows}
        />
      )
      await screen.findByText("Hero One")

      expect(screen.getAllByTestId("goal-row-drag-handle")).toHaveLength(2)
      const number = screen.getAllByTestId("goal-row-priority")[0]!
      expect(number).toHaveTextContent("10")
      expect(number.closest("td")).toContainElement(
        screen.getAllByTestId("goal-row-drag-handle")[0]!
      )
    })

    it("keeps a Rank row's level-requirement sub-lines and Comfortable height at Compact", async () => {
      render(
        <GoalsList
          actions={stubActions}
          density="compact"
          levelPotentialProgress={new Map([["goal-1", 1]])}
          metrics={metricsFor(levelRequirement)}
          rows={rows}
        />
      )
      await screen.findAllByText("Hero One")

      expect(screen.getByTestId("level-requirement-target")).toBeInTheDocument()
      expect(
        screen.getByTestId("level-requirement-progress")
      ).toBeInTheDocument()
      expect(
        screen.getByTestId("level-requirement-remaining")
      ).toBeInTheDocument()
      const [withRequirement, without] = screen.getAllByTestId("goal-row")
      expect(withRequirement).toHaveClass("h-14")
      expect(without).toHaveClass("h-10")
    })

    it("keeps the footer explanation on mobile cards at both densities and tightens spacing at Compact", async () => {
      useIsMobileMock.mockReturnValue(true)
      const metrics = new Map([
        [
          "goal-1",
          {
            progress: rankProgress,
            remaining: {
              upgrades: [],
              shardId: null,
              shards: 0,
              mythicShards: 0,
              orbsByType: {},
              upgradeSlotsRemaining: 3,
            },
            blockers: { isBlocked: false, reasons: [] },
            levelRequirement,
          },
        ],
      ]) as never
      const spacing: Record<string, string> = {}
      for (const density of ["comfortable", "compact"] as const) {
        const { unmount } = render(
          <GoalsList
            actions={stubActions}
            density={density}
            estimates={estimates}
            metrics={metrics}
            potentialProgress={new Map([["goal-1", 0.75]])}
            rows={[rows[0]!]}
          />
        )
        await screen.findByText("Hero One")

        expect(captionFor()).toHaveLength(1)
        expect(screen.getByTestId("goal-row-estimate")).toBeInTheDocument()
        expect(
          screen.getByTestId("level-requirement-remaining")
        ).toBeInTheDocument()
        fireEvent.click(
          screen.getAllByTestId("goal-progress-mobile-footer")[0]!
        )
        expect(
          screen.getByTestId("goal-progress-explanation")
        ).toBeInTheDocument()
        spacing[density] = screen.getByTestId("goal-row").className
        unmount()
      }

      expect(spacing.comfortable).toContain("p-3")
      expect(spacing.compact).toContain("p-2")
      expect(spacing.compact).not.toContain("p-3")
    })

    it("renders the mobile reorder cards identically at both densities", async () => {
      useIsMobileMock.mockReturnValue(true)
      const htmlFor = async (density: "comfortable" | "compact") => {
        const { unmount } = render(
          <GoalsList
            actions={stubActions}
            density={density}
            mobileReorderActive
            reorderEnabled
            rows={rows}
          />
        )
        await screen.findByText("Hero One")
        const html = stable(
          screen.getByTestId("goals-list-reorder-cards").innerHTML
        )
        unmount()
        return html
      }

      expect(await htmlFor("compact")).toEqual(await htmlFor("comfortable"))
    })
  })
})
