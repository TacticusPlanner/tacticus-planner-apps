import { createElement, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { toast } from "sonner"

import { useProjectActions } from "./use-project-actions"

const { createProjectMock } = vi.hoisted(() => ({
  createProjectMock: vi.fn(),
}))

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))
vi.mock("@/entities/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/project")>()
  return {
    ...actual,
    createProject: createProjectMock,
  }
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { retry: false },
    },
  })
  const wrapper = function TestWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
  return { queryClient, wrapper }
}

const created = {
  projectId: "p-new",
  name: "New Project",
  description: null,
  color: null,
  status: "Active",
  isDefault: false,
  revision: 0,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
}

describe("useProjectActions", () => {
  beforeEach(() => {
    createProjectMock.mockReset()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it("stays pending until every overlapping action has settled", async () => {
    let resolveFirst!: () => void
    let resolveSecond!: () => void
    createProjectMock
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
      wrapper: createWrapper().wrapper,
    })
    let first!: Promise<unknown>
    let second!: Promise<unknown>

    act(() => {
      first = result.current.create("A", null, null)
      second = result.current.create("B", null, null)
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

  it("offers no bulk pause/resume action", () => {
    const { result } = renderHook(() => useProjectActions(), {
      wrapper: createWrapper().wrapper,
    })
    expect(result.current).not.toHaveProperty("setGoalsStatus")
  })

  it("returns the created project on success", async () => {
    createProjectMock.mockResolvedValue(created)
    const { result } = renderHook(() => useProjectActions(), {
      wrapper: createWrapper().wrapper,
    })

    let returned!: unknown
    await act(async () => {
      returned = await result.current.create("New Project", null, null)
    })

    expect(returned).toEqual(created)
    expect(toast.success).toHaveBeenCalled()
  })

  it("returns null when project creation fails", async () => {
    createProjectMock.mockRejectedValue(new Error("network error"))
    const { result } = renderHook(() => useProjectActions(), {
      wrapper: createWrapper().wrapper,
    })

    let returned!: unknown
    await act(async () => {
      returned = await result.current.create("New Project", null, null)
    })

    expect(returned).toBeNull()
    expect(toast.error).toHaveBeenCalled()
  })
})
