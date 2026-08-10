import { createElement, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useProjectActions } from "./use-project-actions"

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
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { retry: false },
    },
  })
  return function TestWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

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
