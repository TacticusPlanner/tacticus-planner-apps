import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

import type {
  ActiveSeasonFit,
  GoalRow,
  useGoalActions,
} from "@/features/goal-planning"
import { GoalsList } from "./goals-list"

const stubActions = {
  setStatus: vi.fn(),
  remove: vi.fn(),
  pendingIds: new Set<string>(),
} as unknown as ReturnType<typeof useGoalActions>

const row = (goalId: string, priority: number): GoalRow => ({
  goalId,
  entityType: "Character",
  entityId: "hero1",
  goalType: "Rank",
  status: "Active",
  priority,
  notes: null,
  updatedAt: "2026-07-15T00:00:00Z",
})

const rows = [row("a", 1), row("b", 2), row("c", 3)]

// Guild War: season 28 is running, so the deadline is season 29's start on Nov 28.
const guildWar: ActiveSeasonFit = {
  season: "guildWar",
  seasonNumber: 28,
  deadlineMs: Date.parse("2026-11-28T00:00:00Z"),
  fits: new Map([
    ["a", { offset: 0, date: "2026-11-03" }],
    ["b", { offset: 2, date: "2027-01-10" }],
  ]),
}

beforeEach(async () => {
  useIsMobileMock.mockReturnValue(false)
  await seedGameCatalog({
    characters: [{ id: "hero1", name: "Hero One", faction: "Ultramarines" }],
  })
})

describe("GoalsList season fit", () => {
  it("puts a non-sortable divider row before the cut-off goal and accents fitted rows", async () => {
    render(
      <GoalsList
        actions={stubActions}
        estimates={new Map()}
        reorderEnabled
        rows={rows}
        seasonCutoffGoalId="b"
        seasonFit={guildWar}
      />
    )

    const cutoff = await screen.findByTestId("goals-season-cutoff")
    expect(cutoff).toHaveTextContent(
      "Guild War season 29 starts Nov 28. The next goal finishes after it."
    )
    expect(cutoff.nextElementSibling).toHaveAttribute("data-goal-id", "b")
    // One drag handle per goal: the divider is not a sortable item.
    expect(screen.getAllByTestId("goal-row-drag-handle")).toHaveLength(3)
    const [a, b, c] = screen.getAllByTestId("goal-row")
    expect(a).toHaveAttribute("data-season-fit", "0")
    expect(a!.className).toContain("--season-fit-on-track")
    expect(b!.className).toContain("--season-fit-urgent")
    expect(c).not.toHaveAttribute("data-season-fit")
  })

  it("shows the divider between reorder cards on mobile", async () => {
    useIsMobileMock.mockReturnValue(true)
    render(
      <GoalsList
        actions={stubActions}
        mobileReorderActive
        reorderEnabled
        rows={rows}
        seasonCutoffGoalId="b"
        seasonFit={guildWar}
      />
    )

    const cutoff = await screen.findByTestId("goals-season-cutoff")
    expect(cutoff.nextElementSibling).toHaveAttribute(
      "data-testid",
      "goal-row-reorder-card"
    )
    const [a, b, c] = screen.getAllByTestId("goal-row-reorder-card")
    expect(a).toHaveTextContent("This season")
    expect(b).toHaveTextContent("In 2 seasons")
    expect(c).not.toHaveTextContent("season")
  })

  it("renders no divider or label without a season fit", async () => {
    render(
      <GoalsList actions={stubActions} estimates={new Map()} rows={rows} />
    )

    await screen.findAllByTestId("goal-row")
    expect(screen.queryByTestId("goals-season-cutoff")).toBeNull()
    expect(screen.queryByTestId("goal-season-fit")).toBeNull()
  })
})
