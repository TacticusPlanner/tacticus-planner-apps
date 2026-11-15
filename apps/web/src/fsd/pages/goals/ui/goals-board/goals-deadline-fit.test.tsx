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
  GoalRow,
  ProjectDeadlineFit,
  useGoalActions,
} from "@/features/goal-planning"
import { DeadlineFitHeader, DeadlineOverrideChip } from "./deadline-fit-header"
import { GoalsList } from "./goals-list"
import type { DeadlineFitView } from "./season-fit-copy"

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

const rows = [row("ragnar", 1), row("kharn", 2), row("calgar", 3)]
const DEADLINE = Date.parse("2026-11-27T00:00:00Z")
const target = { kind: "legendaryEvent" as const, eventId: "votanUthar" }

// The Uthar worked example: Ragnar fits, Kharn misses by 1 day, Calgar by 14.
const uthar: DeadlineFitView = {
  kind: "deadline",
  chip: "LE · Uthar",
  deadlineMs: DEADLINE,
  fits: new Map([
    ["ragnar", { fits: true, date: "2026-11-26" }],
    ["kharn", { fits: false, daysLate: 1, date: "2026-11-27" }],
    ["calgar", { fits: false, daysLate: 14, date: "2026-12-10" }],
  ]),
}

const deadline = {
  status: "ready" as const,
  deadlineMs: DEADLINE,
  run: 3 as const,
  estimated: false,
  ended: false,
}

beforeEach(async () => {
  useIsMobileMock.mockReturnValue(false)
  await seedGameCatalog({
    characters: [{ id: "hero1", name: "Hero One", faction: "Ultramarines" }],
  })
})

describe("GoalsList deadline fit", () => {
  it("labels and accents each goal and puts the divider before the first miss", async () => {
    render(
      <GoalsList
        view="Table"
        actions={stubActions}
        estimates={new Map()}
        reorderEnabled
        rows={rows}
        seasonCutoffGoalId="kharn"
        seasonFit={uthar}
      />
    )

    const cutoff = await screen.findByTestId("goals-season-cutoff")
    expect(cutoff).toHaveTextContent(
      "LE · Uthar starts Nov 27. Goals below finish later."
    )
    expect(cutoff.nextElementSibling).toHaveAttribute("data-goal-id", "kharn")
    expect(screen.getAllByTestId("goal-row-drag-handle")).toHaveLength(3)
    const labels = screen.getAllByTestId("goal-deadline-fit")
    expect(labels.map((label) => label.textContent)).toEqual([
      "Fits",
      "Misses by 1 d",
      "Misses by 14 d",
    ])
    const [ragnar, kharn, calgar] = screen.getAllByTestId("goal-row")
    expect(ragnar!.className).toContain("--season-fit-on-track")
    expect(kharn!.className).toContain("--season-fit-caution")
    expect(calgar!.className).toContain("--season-fit-urgent")
  })

  it("shows the labels and divider in mobile reorder mode", async () => {
    useIsMobileMock.mockReturnValue(true)
    render(
      <GoalsList
        view="Cards"
        actions={stubActions}
        mobileReorderActive
        reorderEnabled
        rows={rows}
        seasonCutoffGoalId="kharn"
        seasonFit={uthar}
      />
    )

    const cutoff = await screen.findByTestId("goals-season-cutoff")
    expect(cutoff.nextElementSibling).toHaveAttribute(
      "data-testid",
      "goal-row-reorder-card"
    )
    const [ragnar, kharn] = screen.getAllByTestId("goal-row-reorder-card")
    expect(ragnar).toHaveTextContent("Fits")
    expect(kharn).toHaveTextContent("Misses by 1 d")
  })
})

describe("DeadlineFitHeader", () => {
  const ready = (
    summary: Extract<ProjectDeadlineFit, { status: "ready" }>["summary"]
  ): Exclude<ProjectDeadlineFit, { status: "off" }> => ({
    status: "ready",
    target,
    deadline,
    byGoalId: uthar.fits,
    summary,
  })

  it("names the deadline, the count and the goals not estimated", async () => {
    render(
      <DeadlineFitHeader
        fit={ready({ fit: 2, total: 4, notEstimated: 1, allDone: false })}
      />
    )
    const header = await screen.findByTestId("goals-deadline-fit")
    expect(header).toHaveTextContent("Deadline:")
    expect(header).toHaveTextContent(
      "starts Nov 27 · 2 of 4 fit · 1 not estimated"
    )
  })

  it("reads All N done when every counted goal is done", async () => {
    render(
      <DeadlineFitHeader
        fit={ready({ fit: 7, total: 7, notEstimated: 0, allDone: true })}
      />
    )
    expect(await screen.findByTestId("goals-deadline-fit")).toHaveTextContent(
      "starts Nov 27 · All 7 done"
    )
  })

  it("shows the ended and unavailable states", async () => {
    const { rerender } = render(
      <DeadlineFitHeader
        fit={{
          status: "ended",
          target,
          deadline: {
            ...deadline,
            deadlineMs: Date.parse("2026-11-15"),
            ended: true,
          },
        }}
      />
    )
    expect(await screen.findByTestId("goals-deadline-fit")).toHaveTextContent(
      "· Ended Nov 15"
    )
    rerender(<DeadlineFitHeader fit={{ status: "unavailable", target }} />)
    expect(screen.getByTestId("goals-deadline-fit")).toHaveTextContent(
      "· No date available"
    )
  })

  it("shows a skeleton while loading", async () => {
    render(<DeadlineFitHeader fit={{ status: "loading", target }} />)
    expect(
      await screen.findByTestId("goals-deadline-fit-loading")
    ).toBeInTheDocument()
  })
})

describe("DeadlineOverrideChip", () => {
  it("reads Using project deadline, icon-only with a name on mobile", async () => {
    const { unmount } = render(<DeadlineOverrideChip />)
    expect(
      await screen.findByTestId("goals-season-fit-override")
    ).toHaveTextContent("Using project deadline")
    unmount()
    useIsMobileMock.mockReturnValue(true)
    render(<DeadlineOverrideChip />)
    expect(
      await screen.findByRole("img", { name: "Using project deadline" })
    ).toBeInTheDocument()
  })
})
