import { createElement, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ProjectGoalSummary } from "@/entities/project"

import { reorderedMemberIds, useProjectActions } from "./use-project-actions"

const { activateProjectMock } = vi.hoisted(() => ({
  activateProjectMock: vi.fn(),
}))

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))
vi.mock("@/entities/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/project")>()
  return { ...actual, activateProject: activateProjectMock }
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  return function TestWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function member(goalId: string, priority: number): ProjectGoalSummary {
  return {
    goal: {
      goalId,
      entityType: "Character",
      entityId: goalId,
      goalType: "Rank",
      status: "Active",
      notes: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    priority,
  }
}

describe("reorderedMemberIds", () => {
  it("swaps a goal with its adjacent visible neighbor", () => {
    const members = [member("a", 10), member("b", 20), member("c", 30)]

    const result = reorderedMemberIds(members, "b", "up", ["a", "b", "c"])

    expect(result).toEqual(["b", "a", "c"])
  })

  it("preserves non-visible members' positions when reordering the visible subset", () => {
    // "x" is archived/completed and hidden from the Active tab, but must not be dropped or
    // reshuffled beyond swapping with its visible neighbor.
    const members = [member("a", 10), member("x", 15), member("b", 20)]

    const result = reorderedMemberIds(members, "a", "down", ["a", "b"])

    expect(result).toEqual(["b", "x", "a"])
  })

  it("returns undefined when moving past the start or end of the visible list", () => {
    const members = [member("a", 10), member("b", 20)]

    expect(reorderedMemberIds(members, "a", "up", ["a", "b"])).toBeUndefined()
    expect(reorderedMemberIds(members, "b", "down", ["a", "b"])).toBeUndefined()
  })
})

describe("useProjectActions", () => {
  beforeEach(() => activateProjectMock.mockReset())

  it("stays pending until every overlapping action has settled", async () => {
    let resolveFirst!: () => void
    let resolveSecond!: () => void
    activateProjectMock
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveFirst = resolve
        })
      )
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveSecond = resolve
        })
      )
    const { result } = renderHook(() => useProjectActions(), {
      wrapper: createWrapper(),
    })
    let first!: Promise<void>
    let second!: Promise<void>

    act(() => {
      first = result.current.activate("p1")
      second = result.current.activate("p2")
    })
    await waitFor(() => expect(result.current.pending).toBe(true))

    await act(async () => {
      resolveFirst()
      await first
    })
    expect(result.current.pending).toBe(true)

    await act(async () => {
      resolveSecond()
      await second
    })
    expect(result.current.pending).toBe(false)
  })
})
