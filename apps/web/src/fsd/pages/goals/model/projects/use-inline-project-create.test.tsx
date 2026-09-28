import type { ReactNode } from "react"
import { act, renderHook } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi } from "vitest"

const createProject = vi.fn()
const listProjects = vi.fn()
vi.mock("@/entities/project", () => ({
  createProject: (...args: unknown[]) => createProject(...args),
  projectQueries: {
    all: () => ["projects"],
    list: () => ({
      queryKey: ["projects", "list"],
      queryFn: () => listProjects(),
    }),
  },
}))

import { useInlineProjectCreate } from "./use-inline-project-create"

describe("useInlineProjectCreate", () => {
  it("creates an unstyled custom project and seeds the cached list before the refetch lands", async () => {
    const existing = { projectId: "home", name: "Home", isDefault: true }
    const created = { projectId: "new", name: "Event", isDefault: false }
    createProject.mockResolvedValue(created)
    listProjects.mockReturnValue(new Promise(() => undefined)) // refetch never settles
    const queryClient = new QueryClient()
    queryClient.setQueryData(["projects", "list"], { projects: [existing] })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useInlineProjectCreate(), { wrapper })

    let returned: unknown
    await act(async () => {
      returned = await result.current.create("Event")
    })

    expect(createProject).toHaveBeenCalledWith({
      name: "Event",
      description: null,
      color: null,
    })
    expect(returned).toBe(created)
    expect(queryClient.getQueryData(["projects", "list"])).toEqual({
      projects: [existing, created],
    })
  })
})
