import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen, waitFor } from "@/test/render"

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))

// A minimal live query: undefined until the querier's promise settles, then its value.
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (querier: () => Promise<unknown>) => {
    const [value, setValue] = useState<unknown>()
    useEffect(() => {
      let active = true
      void querier().then((resolved) => {
        if (active) setValue(resolved)
      })
      return () => {
        active = false
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return value
  },
}))

const characters = vi.hoisted(() => ({
  promise: Promise.resolve<unknown>(undefined),
}))

vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacters: () => characters.promise,
  getPlayerMows: () => Promise.resolve(undefined),
  getInventoryUpgrades: () => Promise.resolve(undefined),
  getPlayerInventoryItems: () => Promise.resolve(undefined),
}))

const getGoalDetail = vi.fn<(goalId: string) => Promise<unknown>>()

vi.mock("@/entities/goal", () => ({
  goalQueries: {
    detail: (goalId: string) => ({
      queryKey: ["goals", "detail", goalId],
      queryFn: () => getGoalDetail(goalId),
    }),
  },
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
    getGoalDetail.mockReset()
    characters.promise = Promise.resolve(undefined)
  })

  it("is pending until each goal's detail has loaded", async () => {
    let resolveDetail!: (value: unknown) => void
    getGoalDetail.mockReturnValue(
      new Promise((resolve) => {
        resolveDetail = resolve
      })
    )
    render(<Probe goalIds={["goal-1"]} />)

    await waitFor(() => expect(getGoalDetail).toHaveBeenCalled())
    expect(screen.getByTestId("state")).toHaveTextContent("pending:unknown")

    await act(async () => {
      resolveDetail({
        goalId: "goal-1",
        entityId: "hero1",
        goalType: "Rank",
        config: { rank: { end: 1 } },
      })
      await Promise.resolve()
    })
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent(/^settled:/)
    )
  })

  it("is pending while a player-data table is still loading, then settled even if it was never synced", async () => {
    getGoalDetail.mockRejectedValue(new Error("boom"))
    let resolveCharacters!: (value: unknown) => void
    characters.promise = new Promise((resolve) => {
      resolveCharacters = resolve
    })
    render(<Probe goalIds={["goal-1"]} />)

    await waitFor(() => expect(getGoalDetail).toHaveBeenCalled())
    expect(screen.getByTestId("state")).toHaveTextContent(/^pending:/)

    await act(async () => {
      resolveCharacters(undefined)
      await Promise.resolve()
    })
    // A failed detail and an unsynced table both settle: the goal stays `unknown`, not loading.
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("settled:unknown")
    )
  })
})
