import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
const listGoals = vi.hoisted(() =>
  vi.fn(async ({ archived }: { archived?: boolean }) => ({
    goals: archived
      ? [{ goalId: "old", status: "Archived" }]
      : [
          { goalId: "a", status: "Active" },
          { goalId: "b", status: "Paused" },
        ],
    orderRevision: 1,
  }))
)
vi.mock("../api/goal.api", () => ({ listGoals, getGoal: vi.fn() }))

import { useGoalsById } from "./use-goals-by-id"

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  )
}

describe("useGoalsById", () => {
  it("maps the non-archived goals list by id, without an archived read", async () => {
    listGoals.mockClear()
    const { result } = renderHook(() => useGoalsById(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect([...result.current.goalsById.keys()]).toEqual(["a", "b"])
    expect(listGoals).toHaveBeenCalledTimes(1)
  })

  it("merges the archived list into the same map when asked", async () => {
    const { result } = renderHook(
      () => useGoalsById({ includeArchived: true }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect([...result.current.goalsById.keys()]).toEqual(["a", "b", "old"])
  })
})
