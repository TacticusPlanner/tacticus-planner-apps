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
  return {
    ...renderHook(() => useProjectSelection({ open: true }), { wrapper }),
    client,
  }
}

const projectsResponse = (otherStatus = "Active") => ({
  projects: [
    { projectId: "default", isDefault: true, status: "Active" },
    { projectId: "other", isDefault: false, status: otherStatus },
  ],
})

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

  describe("remembered selection", () => {
    async function rememberOther() {
      listProjects.mockResolvedValue(projectsResponse())
      const hook = setup()
      act(() => hook.result.current.selectProjects(["other"]))
      await waitFor(() => expect(hook.result.current.projects).toHaveLength(2))
      act(() => {
        hook.result.current.remember()
        hook.result.current.reset()
      })
      return hook
    }

    it("offers the remembered projects after a reset", async () => {
      const { result } = await rememberOther()

      expect(result.current.selectedProjectIds).toEqual(["other"])
    })

    it("lets an explicit selection win over the remembered projects", async () => {
      const { result } = await rememberOther()
      act(() => result.current.selectProjects(["default"]))

      expect(result.current.selectedProjectIds).toEqual(["default"])
    })

    it("falls back to the default project when the remembered one was archived", async () => {
      const { result, client } = await rememberOther()
      act(() => {
        client.setQueryData(["projects", "list"], projectsResponse("Archived"))
      })

      await waitFor(() =>
        expect(result.current.selectedProjectIds).toEqual(["default"])
      )
    })

    it("falls back to the default project when the remembered one was removed", async () => {
      const { result, client } = await rememberOther()
      act(() => {
        client.setQueryData(["projects", "list"], {
          projects: [{ projectId: "default", isDefault: true }],
        })
      })

      await waitFor(() =>
        expect(result.current.selectedProjectIds).toEqual(["default"])
      )
    })

    it("starts from the default project in a fresh session", async () => {
      await rememberOther()
      const { result } = setup()

      await waitFor(() =>
        expect(result.current.selectedProjectIds).toEqual(["default"])
      )
    })
  })
})
