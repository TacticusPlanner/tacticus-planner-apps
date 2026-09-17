import { createElement, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useHomeProjects } from "./use-home-projects"

const { useProjectsMock } = vi.hoisted(() => ({
  useProjectsMock: vi.fn(),
}))

vi.mock("@/entities/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/project")>()
  return {
    ...actual,
    useProjects: () => useProjectsMock(),
    projectQueries: {
      ...actual.projectQueries,
      goals: (projectId: string) => ({
        queryKey: ["projects", projectId, "goals"],
        queryFn: () =>
          Promise.resolve({
            goals: [
              {
                goal: {
                  goalId: `${projectId}-g1`,
                  entityType: "Character",
                  entityId: "unit-1",
                  status: "Active",
                },
                priority: 0,
              },
            ],
          }),
      }),
    },
  }
})

function project(overrides: Record<string, unknown>) {
  return {
    projectId: "p1",
    name: "Project",
    color: null,
    description: null,
    status: "Active",
    isActivePlan: false,
    isDefault: false,
    revision: 1,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  return function TestWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe("useHomeProjects", () => {
  it("shows all projects with no cap when 3 or fewer exist", async () => {
    useProjectsMock.mockReturnValue({
      projects: [
        project({ projectId: "p1", isActivePlan: true }),
        project({ projectId: "p2" }),
      ],
      fetchState: { status: "success" },
      loading: false,
      retry: vi.fn(),
    })

    const { result } = renderHook(() => useHomeProjects(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.status).toBe("ready"))
    if (result.current.status !== "ready") throw new Error("expected ready")
    expect(result.current.projects.map((project) => project.projectId)).toEqual(
      ["p1", "p2"]
    )
    expect(result.current.remainingCount).toBe(0)
  })

  it("caps to 3 projects (Current plan first) and reports the remaining count", async () => {
    useProjectsMock.mockReturnValue({
      projects: [
        project({ projectId: "p2" }),
        project({ projectId: "p1", isActivePlan: true }),
        project({ projectId: "p3" }),
        project({ projectId: "p4" }),
        project({ projectId: "p5" }),
      ],
      fetchState: { status: "success" },
      loading: false,
      retry: vi.fn(),
    })

    const { result } = renderHook(() => useHomeProjects(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.status).toBe("ready"))
    if (result.current.status !== "ready") throw new Error("expected ready")
    expect(result.current.projects.map((project) => project.projectId)).toEqual(
      ["p1", "p2", "p3"]
    )
    expect(result.current.remainingCount).toBe(2)
  })

  it("shows every non-archived project uncapped when limit is null (desktop)", async () => {
    useProjectsMock.mockReturnValue({
      projects: [
        project({ projectId: "p2" }),
        project({ projectId: "p1", isActivePlan: true }),
        project({ projectId: "p3" }),
        project({ projectId: "p4" }),
        project({ projectId: "p5" }),
      ],
      fetchState: { status: "success" },
      loading: false,
      retry: vi.fn(),
    })

    const { result } = renderHook(() => useHomeProjects(null), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.status).toBe("ready"))
    if (result.current.status !== "ready") throw new Error("expected ready")
    expect(result.current.projects.map((project) => project.projectId)).toEqual(
      ["p1", "p2", "p3", "p4", "p5"]
    )
    expect(result.current.remainingCount).toBe(0)
  })

  it("has no Current plan set", async () => {
    useProjectsMock.mockReturnValue({
      projects: [project({ projectId: "p1" }), project({ projectId: "p2" })],
      fetchState: { status: "success" },
      loading: false,
      retry: vi.fn(),
    })

    const { result } = renderHook(() => useHomeProjects(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.status).toBe("ready"))
    if (result.current.status !== "ready") throw new Error("expected ready")
    expect(result.current.projects.map((project) => project.projectId)).toEqual(
      ["p1", "p2"]
    )
  })

  it("excludes archived projects", async () => {
    useProjectsMock.mockReturnValue({
      projects: [
        project({ projectId: "p1", isActivePlan: true }),
        project({ projectId: "p2", status: "Archived" }),
      ],
      fetchState: { status: "success" },
      loading: false,
      retry: vi.fn(),
    })

    const { result } = renderHook(() => useHomeProjects(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.status).toBe("ready"))
    if (result.current.status !== "ready") throw new Error("expected ready")
    expect(result.current.projects.map((project) => project.projectId)).toEqual(
      ["p1"]
    )
    expect(result.current.remainingCount).toBe(0)
  })

  it("reports empty when there are no projects", async () => {
    useProjectsMock.mockReturnValue({
      projects: [],
      fetchState: { status: "success" },
      loading: false,
      retry: vi.fn(),
    })

    const { result } = renderHook(() => useHomeProjects(), {
      wrapper: createWrapper(),
    })

    expect(result.current.status).toBe("empty")
  })
})
