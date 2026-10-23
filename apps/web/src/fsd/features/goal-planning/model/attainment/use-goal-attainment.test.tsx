import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@/test/render"
import { seedPlayerData } from "@/test/seed"

// The goals list read, controlled per test.
const goalsList = vi.hoisted(() => ({
  goalsById: new Map<string, unknown>(),
  loading: true,
  isError: false,
}))

vi.mock("@/entities/goal", () => ({
  useGoalsById: () => ({ ...goalsList, retry: () => {} }),
}))

import { useGoalAttainmentState } from "./use-goal-attainment"

function Probe({ goalIds }: { goalIds: string[] }) {
  const { byGoalId, pending } = useGoalAttainmentState(goalIds)
  return (
    <span data-testid="state">
      {`${pending ? "pending" : "settled"}:${goalIds
        .map((id) => byGoalId.get(id)?.status)
        .join(",")}`}
    </span>
  )
}

describe("useGoalAttainmentState", () => {
  beforeEach(() => {
    goalsList.goalsById = new Map()
    goalsList.loading = true
    goalsList.isError = false
  })

  it("lets the goals list alone decide loading, then reads each goal from it", async () => {
    await seedPlayerData({ characters: [{ unitId: "hero1", rank: "Stone1" }] })
    const view = render(<Probe goalIds={["goal-1"]} />)
    expect(screen.getByTestId("state")).toHaveTextContent("pending:unknown")

    goalsList.loading = false
    goalsList.goalsById = new Map([
      [
        "goal-1",
        {
          goalId: "goal-1",
          entityId: "hero1",
          goalType: "Rank",
          config: { rank: { end: 1 } },
        },
      ],
    ])
    view.rerender(<Probe goalIds={["goal-1"]} />)

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent(/^settled:/)
    )
  })

  it("is pending while a player-data table is still loading, then settled even if it was never synced", async () => {
    goalsList.loading = false
    goalsList.isError = true
    render(<Probe goalIds={["goal-1"]} />)

    // The real live queries resolve after mount; nothing is synced, so every table reads `undefined`.
    expect(screen.getByTestId("state")).toHaveTextContent(/^pending:/)

    // A failed list read and an unsynced table both settle: the goal stays `unknown`, not loading.
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("settled:unknown")
    )
  })
})
