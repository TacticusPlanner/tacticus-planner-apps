import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

import type {
  ActiveSeasonFit,
  GoalOverviewMetrics,
  GoalRow,
  useGoalActions,
} from "@/features/goal-planning"
import { NO_BLOCKERS } from "@/features/goal-planning"
import { GoalsList } from "./goals-list"

const setStatus = vi.fn(() => Promise.resolve(true))
const stubActions = {
  setStatus,
  remove: vi.fn(),
  pendingIds: new Set<string>(),
} as unknown as ReturnType<typeof useGoalActions>

const row = (goalId: string, priority: number, extra: Partial<GoalRow> = {}) =>
  ({
    goalId,
    entityType: "Character",
    entityId: "hero1",
    goalType: "Rank",
    status: "Active",
    priority,
    notes: null,
    updatedAt: "2026-07-15T00:00:00Z",
    ...extra,
  }) as GoalRow

const rankMetrics = {
  progress: {
    kind: "Rank",
    current: "Gold3",
    target: "Diamond1",
    targetSlots: 0,
    ratio: 0.4,
    reachableRatio: null,
    reachableRank: null,
    reachableAppliedSlots: null,
    reachableRankLimitedBy: null,
  },
  remaining: null,
  blockers: NO_BLOCKERS,
  levelRequirement: null,
} as unknown as GoalOverviewMetrics

const estimate = {
  days: 22,
  date: "2026-10-11",
  energyTotal: 1240,
  raidsTotal: 30,
}

beforeEach(async () => {
  useIsMobileMock.mockReturnValue(false)
  setStatus.mockClear()
  await seedGameCatalog({
    characters: [
      { id: "hero1", name: "Hero One", faction: "Ultramarines" },
      { id: "hero2", name: "Hero Two", faction: "Ultramarines" },
    ],
  })
})

describe("Goal cards", () => {
  it("lays a desktop card out as header, body, ruled notes and footer", async () => {
    render(
      <GoalsList
        actions={stubActions}
        estimates={new Map([["g1", estimate]]) as never}
        metrics={new Map([["g1", rankMetrics]])}
        reorderEnabled
        rows={[
          row("g1", 3, {
            notes: "farm on Tuesdays",
            projects: [{ projectId: "p1", name: "Neuro", color: null }],
          }),
        ]}
        view="Cards"
      />
    )

    const card = await screen.findByTestId("goal-row")
    const header = within(card).getByTestId("goal-card-header")
    // The unit's display name arrives from the catalog store after the first render.
    expect(
      await within(header).findByRole("checkbox", { name: "Select Hero One" })
    ).toBeInTheDocument()
    expect(within(header).getByTestId("goal-row-priority")).toHaveTextContent(
      "3"
    )
    expect(
      within(header).getByTestId("goal-row-drag-handle")
    ).toBeInTheDocument()
    expect(within(header).getByText("Hero One")).toBeInTheDocument()
    const meta = within(header).getByTestId("goal-card-meta")
    expect(within(meta).getByTestId("goal-row-estimate")).toBeInTheDocument()
    expect(meta).toHaveTextContent("Neuro")
    expect(
      within(header).getByTestId("goal-row-actions-trigger-g1")
    ).toBeInTheDocument()
    expect(within(card).getByTestId("goal-row-notes")).toHaveTextContent(
      "farm on Tuesdays"
    )
    const footer = within(card).getByTestId("goal-card-footer")
    expect(within(footer).getByTestId("goal-status-badge")).toHaveTextContent(
      "Active"
    )

    // Regions in V1's order: header, body, notes, footer.
    const order = [
      "goal-card-header",
      "goal-card-body",
      "goal-row-notes",
      "goal-card-footer",
    ].map((id) => within(card).getByTestId(id))
    for (let index = 1; index < order.length; index += 1) {
      expect(
        order[index - 1]!.compareDocumentPosition(order[index]!) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy()
    }
  })

  it("omits the notes section and empty meta items", async () => {
    render(
      <GoalsList actions={stubActions} rows={[row("g1", 1)]} view="Cards" />
    )

    const card = await screen.findByTestId("goal-row")
    expect(within(card).queryByTestId("goal-row-notes")).not.toBeInTheDocument()
    const meta = within(card).getByTestId("goal-card-meta")
    expect(meta).toBeEmptyDOMElement()
    expect(within(card).getByTestId("goal-card-footer")).toBeInTheDocument()
  })

  it("renders a Reached goal tinted, with a check and no drag handle", async () => {
    render(
      <GoalsList
        actions={stubActions}
        reachedByGoalId={new Map([["g1", true]])}
        reorderEnabled
        rows={[row("g1", 1)]}
        view="Cards"
      />
    )

    const card = await screen.findByTestId("goal-row")
    expect(card).toHaveAttribute("data-reached", "true")
    expect(card.className).toContain("bg-success")
    expect(within(card).getByTestId("goal-status-badge")).toHaveTextContent(
      "Reached"
    )
    expect(
      within(card).getAllByTestId("goal-reached-dash").length
    ).toBeGreaterThan(0)
  })

  it("pauses the goal from the footer status chip", async () => {
    render(
      <GoalsList actions={stubActions} rows={[row("g1", 1)]} view="Cards" />
    )

    const footer = await screen.findByTestId("goal-card-footer")
    fireEvent.click(within(footer).getByRole("button", { name: /Pause/ }))
    expect(setStatus).toHaveBeenCalledWith("g1", "Paused", "Active", [])
  })

  it("shows no drag handle where the list isn't reorderable", async () => {
    render(
      <GoalsList
        actions={stubActions}
        reorderEnabled={false}
        rows={[row("g1", 1)]}
        view="Cards"
      />
    )

    await screen.findByTestId("goal-row")
    expect(screen.queryByTestId("goal-row-drag-handle")).not.toBeInTheDocument()
  })

  it("shows checkboxes on mobile only in select mode, and never an inline handle", async () => {
    useIsMobileMock.mockReturnValue(true)
    const { rerender } = render(
      <GoalsList actions={stubActions} reorderEnabled rows={[row("g1", 1)]} />
    )

    const card = await screen.findByTestId("goal-row")
    expect(within(card).queryByRole("checkbox")).not.toBeInTheDocument()
    expect(within(card).queryByTestId("goal-row-drag-handle")).toBeNull()
    expect(screen.queryByTestId("goals-select-all")).not.toBeInTheDocument()

    rerender(
      <GoalsList
        actions={stubActions}
        reorderEnabled
        rows={[row("g1", 1)]}
        selectActive
      />
    )
    expect(
      within(screen.getByTestId("goal-row")).getByRole("checkbox")
    ).toBeInTheDocument()
  })
})

describe("Goal card rows", () => {
  const remaining = (extra: Record<string, unknown>) => ({
    upgrades: [],
    shardId: null,
    shards: 0,
    mythicShards: 0,
    orbsByType: {},
    upgradeSlotsRemaining: null,
    ...extra,
  })

  it("puts energy at the end of the target row and gold at the end of the level row", async () => {
    const metrics = {
      ...rankMetrics,
      remaining: remaining({ levelGold: 61_000 }),
      levelRequirement: {
        kind: "LevelRequirement",
        current: 40,
        target: 50,
        ratio: 0.8,
        reachableRatio: null,
        reachableLevel: null,
        remainingXp: 9000,
      },
    } as unknown as GoalOverviewMetrics
    render(
      <GoalsList
        actions={stubActions}
        estimates={new Map([["g1", estimate]]) as never}
        metrics={new Map([["g1", metrics]])}
        rows={[row("g1", 1)]}
        view="Cards"
      />
    )

    const card = await screen.findByTestId("goal-row")
    const targetRow = within(card).getByTestId("goal-card-target-row")
    const levelRow = within(card).getByTestId("goal-card-level-row")
    // Chip names only (the rank emblem's own name, "Gold III", would also match /gold/).
    const chipNames = (scope: HTMLElement) =>
      within(scope)
        .queryAllByTestId("goal-resource-chip")
        .map((chip) => within(chip).getByRole("img").getAttribute("aria-label"))
    expect(chipNames(targetRow)).toEqual([expect.stringMatching(/energy/i)])
    expect(chipNames(levelRow)).toEqual([expect.stringMatching(/gold/i)])
    // Each chip renders once: nothing is repeated in a chip row below.
    expect(chipNames(card)).toHaveLength(2)
  })

  it("puts tokens on the target row and leaves shards in the chip row below", async () => {
    const metrics = {
      progress: {
        kind: "Unlock",
        owned: 18,
        required: 300,
        ratio: 0.06,
      },
      remaining: remaining({ shards: 282 }),
      blockers: NO_BLOCKERS,
      levelRequirement: null,
    } as unknown as GoalOverviewMetrics
    render(
      <GoalsList
        actions={stubActions}
        estimates={
          new Map([["g1", { ...estimate, onslaughtTokens: 15 }]]) as never
        }
        metrics={new Map([["g1", metrics]])}
        rows={[row("g1", 1, { goalType: "Unlock" })]}
        view="Cards"
      />
    )

    const card = await screen.findByTestId("goal-row")
    const targetRow = within(card).getByTestId("goal-card-target-row")
    expect(
      within(targetRow).getByRole("img", { name: /onslaught/i })
    ).toBeInTheDocument()
    expect(within(targetRow).queryByRole("img", { name: /shard/i })).toBeNull()
    expect(within(card).getAllByRole("img", { name: /shard/i })).toHaveLength(1)
    expect(within(card).queryByTestId("goal-card-level-row")).toBeNull()
  })

  it("lays an Ascension card out as V1 did: orbs, then labelled shard bars, no progress bar", async () => {
    const metrics = {
      progress: {
        kind: "Ascension",
        current: "Legendary:RedFiveStars",
        target: "Legendary:OneBlueStar",
        ratio: 0.2,
      },
      remaining: remaining({
        shards: 280,
        orbsByType: { Legendary: 20 },
        shardProgress: {
          shards: { owned: 120, needed: 400 },
          mythicShards: { owned: 0, needed: 0 },
        },
      }),
      blockers: NO_BLOCKERS,
      levelRequirement: null,
    } as unknown as GoalOverviewMetrics
    render(
      <GoalsList
        actions={stubActions}
        estimates={new Map([["g1", estimate]]) as never}
        metrics={new Map([["g1", metrics]])}
        potentialProgress={new Map([["g1", 0.5]])}
        rows={[row("g1", 1, { goalType: "Ascension" })]}
        view="Cards"
      />
    )

    const card = await screen.findByTestId("goal-row")
    const targetRow = within(card).getByTestId("goal-card-target-row")
    expect(
      within(targetRow).getByRole("img", { name: /energy/i })
    ).toBeInTheDocument()
    expect(within(card).getByRole("img", { name: /orbs/i })).toBeInTheDocument()
    const shards = within(card).getByTestId("goal-shard-progress-shards")
    expect(shards).toHaveTextContent("Shards")
    expect(shards).toHaveTextContent("120 / 400")
    expect(
      within(shards).getByRole("progressbar", { name: "Shards: 120 of 400" })
    ).toBeInTheDocument()
    // No mythic bar when the goal costs none, no shard chip beside the bar, no general progress bar.
    expect(
      within(card).queryByTestId("goal-shard-progress-mythicShards")
    ).toBeNull()
    expect(within(card).queryByRole("img", { name: /shards:/i })).toBeNull()
    expect(within(card).queryByTestId("goal-progress-percent")).toBeNull()
  })

  it("lays an Ability card out as V1 did: costs and energy on top, track blocks, then the level row", async () => {
    const metrics = {
      progress: {
        kind: "Ability",
        currentActive: 20,
        targetActive: 26,
        currentPassive: 20,
        targetPassive: 50,
        ratio: 0.1,
      },
      remaining: remaining({
        abilityMaterials: {
          gold: 505_000,
          badgesByRarity: { Epic: 12 },
          forgeBadgesByRarity: {},
          components: 0,
        },
      }),
      blockers: NO_BLOCKERS,
      levelRequirement: {
        kind: "LevelRequirement",
        current: 40,
        target: 50,
        ratio: 0.8,
        reachableRatio: null,
        reachableLevel: null,
        remainingXp: 9000,
      },
    } as unknown as GoalOverviewMetrics
    render(
      <GoalsList
        actions={stubActions}
        estimates={new Map([["g1", estimate]]) as never}
        metrics={new Map([["g1", metrics]])}
        rows={[row("g1", 1, { goalType: "Ability" })]}
        view="Cards"
      />
    )

    const card = await screen.findByTestId("goal-row")
    const costRow = within(card).getByTestId("goal-card-cost-row")
    const chipNames = within(costRow)
      .getAllByTestId("goal-resource-chip")
      .map((chip) => within(chip).getByRole("img").getAttribute("aria-label"))
    expect(chipNames).toEqual([
      expect.stringMatching(/gold/i),
      expect.stringMatching(/ability badges/i),
      expect.stringMatching(/energy/i),
    ])
    const targetRow = within(card).getByTestId("goal-card-target-row")
    expect(
      within(targetRow).getByTestId("goal-ability-pill-active")
    ).toHaveTextContent(/Active\s*20\s*26/)
    expect(
      within(targetRow).getByTestId("goal-ability-pill-active")
    ).toHaveClass("flex-1")
    expect(within(card).getByTestId("goal-card-level-row")).toBeInTheDocument()
    expect(
      within(within(card).getByTestId("goal-card-level-row")).queryAllByTestId(
        "goal-resource-chip"
      )
    ).toHaveLength(0)
    // The only progress readout is the level row's own Potential bar.
    const levelRow = within(card).getByTestId("goal-card-level-row")
    for (const percent of within(card).queryAllByTestId(
      "goal-progress-percent"
    ))
      expect(levelRow).toContainElement(percent)
    // Order: cost row, track blocks, level row.
    expect(
      costRow.compareDocumentPosition(targetRow) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("truncates a long project name in the meta line and keeps it in the tooltip", async () => {
    const name = "V1 import · 26 Oct, 13:48 UTC"
    render(
      <GoalsList
        actions={stubActions}
        rows={[
          row("g1", 1, { projects: [{ projectId: "p1", name, color: null }] }),
        ]}
        view="Cards"
      />
    )

    const meta = within(await screen.findByTestId("goal-row")).getByTestId(
      "goal-card-meta"
    )
    const badge = within(meta).getByTitle(name)
    expect(badge).toHaveClass("max-w-40")
    expect(within(badge).getByText(name)).toHaveClass("truncate")
  })
})

describe("Goal cards grid", () => {
  const rows = [row("a", 1), row("b", 2), row("c", 3)]

  it("renders the cards as an auto-fill grid with a 380px minimum column", async () => {
    render(<GoalsList actions={stubActions} rows={rows} view="Cards" />)

    const grid = await screen.findByTestId("goals-list-cards")
    expect(grid.className).toContain(
      "[grid-template-columns:repeat(auto-fill,minmax(min(380px,100%),1fr))]"
    )
    expect(within(grid).getAllByTestId("goal-row")).toHaveLength(3)
    expect(screen.queryByTestId("goals-list-table")).not.toBeInTheDocument()
  })

  it("renders the table instead when Table view is selected", async () => {
    render(<GoalsList actions={stubActions} rows={rows} view="Table" />)

    expect(await screen.findByTestId("goals-list-table")).toBeInTheDocument()
    expect(screen.queryByTestId("goals-list-cards")).not.toBeInTheDocument()
  })

  it("renders cards on mobile even when Table view is stored", async () => {
    useIsMobileMock.mockReturnValue(true)
    render(<GoalsList actions={stubActions} rows={rows} view="Table" />)

    expect(await screen.findByTestId("goals-list-cards")).toBeInTheDocument()
    expect(screen.queryByTestId("goals-list-table")).not.toBeInTheDocument()
  })

  it("shows the Actual/Potential legend once, only when a goal has a Potential ratio", async () => {
    const { rerender } = render(
      <GoalsList actions={stubActions} rows={rows} view="Cards" />
    )
    await screen.findAllByTestId("goal-row")
    expect(screen.queryByTestId("goals-progress-legend")).toBeNull()

    rerender(
      <GoalsList
        actions={stubActions}
        potentialProgress={
          new Map([
            ["a", 0.6],
            ["b", 0.7],
          ])
        }
        rows={rows}
        view="Cards"
      />
    )
    expect(screen.getAllByTestId("goals-progress-legend")).toHaveLength(1)
  })

  it("puts a full-width season divider before the cut-off card", async () => {
    const seasonFit: ActiveSeasonFit = {
      season: "guildWar",
      seasonNumber: 28,
      deadlineMs: Date.parse("2026-11-28T00:00:00Z"),
      fits: new Map([
        ["a", { offset: 0, date: "2026-11-03" }],
        ["b", { offset: 2, date: "2027-01-10" }],
      ]),
    }
    render(
      <GoalsList
        actions={stubActions}
        estimates={new Map()}
        reorderEnabled
        rows={rows}
        seasonCutoffGoalId="b"
        seasonFit={seasonFit}
        view="Cards"
      />
    )

    const cutoff = await screen.findByTestId("goals-season-cutoff")
    expect(cutoff.className).toContain("col-span-full")
    expect(cutoff.nextElementSibling).toHaveAttribute("data-goal-id", "b")
    expect(screen.getAllByTestId("goal-row-drag-handle")).toHaveLength(3)
  })

  it("selects every visible goal from the select-all checkbox above the grid", async () => {
    const onSelectAllVisible = vi.fn()
    const { rerender } = render(
      <GoalsList
        actions={stubActions}
        onSelectAllVisible={onSelectAllVisible}
        rows={rows}
        selection={new Set()}
        view="Cards"
      />
    )

    const selectAll = await screen.findByTestId("goals-select-all")
    expect(selectAll).toHaveAttribute("data-state", "unchecked")
    fireEvent.click(selectAll)
    expect(onSelectAllVisible).toHaveBeenCalledTimes(1)

    rerender(
      <GoalsList
        actions={stubActions}
        onSelectAllVisible={onSelectAllVisible}
        rows={rows}
        selection={new Set(["a"])}
        view="Cards"
      />
    )
    expect(screen.getByTestId("goals-select-all")).toHaveAttribute(
      "data-state",
      "indeterminate"
    )

    rerender(
      <GoalsList
        actions={stubActions}
        onSelectAllVisible={onSelectAllVisible}
        rows={rows}
        selection={new Set(["a", "b", "c"])}
        view="Cards"
      />
    )
    expect(screen.getByTestId("goals-select-all")).toHaveAttribute(
      "data-state",
      "checked"
    )
  })

  it("toggles one goal from its card checkbox without touching other controls", async () => {
    const onToggleSelected = vi.fn()
    render(
      <GoalsList
        actions={stubActions}
        onToggleSelected={onToggleSelected}
        rows={rows}
        selection={new Set()}
        view="Cards"
      />
    )

    fireEvent.click(await screen.findByTestId("goal-row-select-b"))
    expect(onToggleSelected).toHaveBeenCalledWith("b")
    expect(setStatus).not.toHaveBeenCalled()
  })
})
