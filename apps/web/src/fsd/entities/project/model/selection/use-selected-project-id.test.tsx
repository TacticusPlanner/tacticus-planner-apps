import { afterEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"

import type { ProjectSummary } from "../types"
import {
  SELECTED_PROJECT_STORAGE_KEY,
  readStoredProjectId,
  subscribeSelectedProject,
  writeStoredProjectId,
} from "./selected-project"
import { useSelectedProjectId } from "./use-selected-project-id"

const projects = [{ projectId: "p1", status: "Active" }] as ProjectSummary[]
const loaded = {
  projects,
  fetchState: { status: "success" as const },
  loading: false,
}

describe("useSelectedProjectId", () => {
  it("defaults to all goals", () => {
    const { result } = renderHook(() => useSelectedProjectId(loaded))
    expect(result.current[0]).toBeUndefined()
  })

  it("shares one selection between every caller", () => {
    const first = renderHook(() => useSelectedProjectId(loaded))
    const second = renderHook(() => useSelectedProjectId(loaded))

    act(() => first.result.current[1]("p1"))

    expect(first.result.current[0]).toBe("p1")
    expect(second.result.current[0]).toBe("p1")
  })

  it("restores the stored project on a later mount", () => {
    window.localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, "p1")
    const { result } = renderHook(() => useSelectedProjectId(loaded))
    expect(result.current[0]).toBe("p1")
  })

  it("falls back to all goals when the stored project was deleted", () => {
    window.localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, "deleted")
    const { result } = renderHook(() => useSelectedProjectId(loaded))
    expect(result.current[0]).toBeUndefined()
  })

  it("follows a change made in another tab", () => {
    const { result } = renderHook(() => useSelectedProjectId(loaded))
    act(() => {
      window.localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, "p1")
      window.dispatchEvent(
        new StorageEvent("storage", { key: SELECTED_PROJECT_STORAGE_KEY })
      )
    })
    expect(result.current[0]).toBe("p1")
  })
})

describe("stored project selection", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("stores a project and clears it for all goals", () => {
    writeStoredProjectId("p1")
    expect(window.localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY)).toBe("p1")
    expect(readStoredProjectId()).toBe("p1")

    writeStoredProjectId(undefined)
    expect(window.localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY)).toBeNull()
    expect(readStoredProjectId()).toBeNull()
  })

  it("is account data, so sign-out removes it", () => {
    expect(SELECTED_PROJECT_STORAGE_KEY.startsWith("tp.user.")).toBe(true)
  })

  it("notifies subscribers on a write", () => {
    const listener = vi.fn()
    const unsubscribe = subscribeSelectedProject(listener)
    writeStoredProjectId("p1")
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    writeStoredProjectId("p2")
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("keeps the selection for the visit when storage refuses the write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota")
    })
    writeStoredProjectId("p1")
    expect(readStoredProjectId()).toBe("p1")

    writeStoredProjectId(undefined)
    expect(readStoredProjectId()).toBeNull()
  })
})
