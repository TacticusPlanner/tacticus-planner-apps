import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useProjectSelection } from "./use-project-selection"

const listProjects = vi.fn()

vi.mock("@/entities/project", () => ({
  projectQueries: {
    list: () => ({
      queryKey: ["projects", "list"],
      queryFn: () => listProjects(),
    }),
  },
}))

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useProjectSelection({ open: true }), { wrapper })
}

describe("useProjectSelection", () => {
  it("falls back to the default project when a prefilled ID is not one of the account's projects", async () => {
    listProjects.mockResolvedValue({
      projects: [
        { projectId: "default", isDefault: true },
        { projectId: "other", isDefault: false },
      ],
    })
    const { result } = setup()
    act(() => result.current.selectProjects(["missing"]))

    await waitFor(() =>
      expect(result.current.selectedProjectIds).toEqual(["default"])
    )
  })

  it("keeps a prefilled ID that is one of the account's projects", async () => {
    listProjects.mockResolvedValue({
      projects: [
        { projectId: "default", isDefault: true },
        { projectId: "other", isDefault: false },
      ],
    })
    const { result } = setup()
    act(() => result.current.selectProjects(["other"]))

    await waitFor(() => expect(result.current.projects).toHaveLength(2))
    expect(result.current.selectedProjectIds).toEqual(["other"])
  })
})
