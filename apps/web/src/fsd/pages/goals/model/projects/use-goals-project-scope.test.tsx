import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { MemoryRouter, useLocation } from "react-router"
import type { ReactNode } from "react"

import type { ProjectSummary } from "@/entities/project"

import { useGoalsProjectScope } from "./use-goals-project-scope"

const project = (
  projectId: string,
  status: ProjectSummary["status"] = "Active"
) =>
  ({
    projectId,
    name: projectId,
    description: null,
    color: null,
    status,
    isDefault: false,
    revision: 0,
    createdAt: "",
    updatedAt: "",
  }) as ProjectSummary

const projects = [project("a"), project("old", "Archived")]

function setup(initialEntry: string, ready = true, list = projects) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
  )
  return renderHook(
    () => ({
      scope: useGoalsProjectScope(list, ready),
      location: useLocation(),
    }),
    { wrapper }
  )
}

describe("useGoalsProjectScope", () => {
  it("scopes to a known non-archived project", () => {
    const { result } = setup("/plan/goals?project=a")
    expect(result.current.scope.projectId).toBe("a")
    expect(result.current.location.search).toBe("?project=a")
  })

  it.each(["unknown", "old"])(
    "drops %s from the URL and shows all goals",
    (id) => {
      const { result } = setup(`/plan/goals?project=${id}`)
      expect(result.current.scope.projectId).toBeUndefined()
      expect(result.current.location.search).toBe("")
    }
  )

  it("keeps the param but stays unscoped while projects are not ready", () => {
    const { result } = setup("/plan/goals?project=a", false, [])
    expect(result.current.scope.projectId).toBeUndefined()
    expect(result.current.location.search).toBe("?project=a")
  })

  it("writes and clears the param by replacing the history entry", () => {
    const { result } = setup("/plan/goals")
    act(() => result.current.scope.setProjectId("a"))
    expect(result.current.scope.projectId).toBe("a")
    expect(result.current.location.search).toBe("?project=a")
    act(() => result.current.scope.setProjectId(undefined))
    expect(result.current.location.search).toBe("")
    expect(result.current.location.key).toBeDefined()
  })
})
