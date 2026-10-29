import { createElement, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { toast } from "sonner"

import { ApiError } from "@/shared/api"

import { planningSettingsQueries } from "../api/planning-settings.queries"
import type { PlanningSettings } from "./types"
import { useGoalsView } from "./use-goals-view"

const { getMock, updateMock, auth } = vi.hoisted(() => ({
  getMock: vi.fn(),
  updateMock: vi.fn(),
  auth: { signedIn: true },
}))

vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => auth.signedIn,
}))
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock("../api/planning-settings.api", () => ({
  getPlanningSettings: getMock,
  updatePlanningSettings: updateMock,
}))

const stored: PlanningSettings = {
  dailyEnergy: 438,
  xpBookRarity: "Epic",
  goalsView: "Cards",
  revision: 3,
}

function setup(initial: PlanningSettings | Promise<PlanningSettings>) {
  getMock.mockReturnValue(
    initial instanceof Promise ? initial : Promise.resolve(initial)
  )
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  const hook = renderHook(() => useGoalsView(), { wrapper })
  const cached = () =>
    client.getQueryData<PlanningSettings>(
      planningSettingsQueries.current().queryKey
    )
  return { hook, cached }
}

describe("useGoalsView", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.signedIn = true
  })

  it("reads the stored view and treats a missing one as Cards", async () => {
    const { hook } = setup({
      ...stored,
      goalsView: undefined as unknown as "Cards",
    })
    expect(hook.result.current.loading).toBe(true)
    await waitFor(() => expect(hook.result.current.loading).toBe(false))
    expect(hook.result.current.view).toBe("Cards")
  })

  it("reads Cards when the settings request fails", async () => {
    const { hook } = setup(Promise.reject(new ApiError(500, "boom")))
    await waitFor(() => expect(hook.result.current.loading).toBe(false))
    expect(hook.result.current.view).toBe("Cards")
  })

  it("reads Cards and never loads while signed out", () => {
    auth.signedIn = false
    const { hook } = setup(stored)
    expect(hook.result.current.loading).toBe(false)
    expect(hook.result.current.view).toBe("Cards")
    act(() => hook.result.current.setView("Table"))
    expect(updateMock).not.toHaveBeenCalled()
  })

  it("switches immediately and saves the full settings with the new view", async () => {
    let resolveSave: (value: PlanningSettings) => void = () => undefined
    updateMock.mockReturnValue(
      new Promise<PlanningSettings>((resolve) => (resolveSave = resolve))
    )
    const { hook, cached } = setup(stored)
    await waitFor(() => expect(hook.result.current.loading).toBe(false))

    act(() => hook.result.current.setView("Table"))

    await waitFor(() => expect(hook.result.current.view).toBe("Table"))
    expect(updateMock).toHaveBeenCalledWith({ ...stored, goalsView: "Table" })
    act(() => resolveSave({ ...stored, goalsView: "Table", revision: 4 }))
    await waitFor(() => expect(cached()?.revision).toBe(4))
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("merges onto the other device's settings and retries once on a conflict", async () => {
    const other: PlanningSettings = {
      dailyEnergy: 638,
      xpBookRarity: "Mythic",
      goalsView: "Cards",
      revision: 7,
    }
    updateMock
      .mockRejectedValueOnce(
        new ApiError(409, "stale", { issueCode: "concurrency", current: other })
      )
      .mockResolvedValueOnce({ ...other, goalsView: "Table", revision: 8 })
    const { hook, cached } = setup(stored)
    await waitFor(() => expect(hook.result.current.loading).toBe(false))

    act(() => hook.result.current.setView("Table"))

    await waitFor(() => expect(cached()?.revision).toBe(8))
    expect(updateMock).toHaveBeenNthCalledWith(2, {
      ...other,
      goalsView: "Table",
    })
    expect(hook.result.current.view).toBe("Table")
    expect(cached()).toMatchObject({ dailyEnergy: 638, xpBookRarity: "Mythic" })
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("reverts and shows a toast when the retry also conflicts", async () => {
    const conflict = new ApiError(409, "stale", {
      issueCode: "concurrency",
      current: { ...stored, revision: 9 },
    })
    updateMock.mockRejectedValue(conflict)
    const { hook } = setup(stored)
    await waitFor(() => expect(hook.result.current.loading).toBe(false))

    act(() => hook.result.current.setView("Table"))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("goals.view.saveError")
    )
    expect(updateMock).toHaveBeenCalledTimes(2)
    expect(hook.result.current.view).toBe("Cards")
  })

  it("reverts and shows a toast on any other failure", async () => {
    updateMock.mockRejectedValue(new ApiError(500, "boom"))
    const { hook } = setup(stored)
    await waitFor(() => expect(hook.result.current.loading).toBe(false))

    act(() => hook.result.current.setView("Table"))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("goals.view.saveError")
    )
    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(hook.result.current.view).toBe("Cards")
  })
})
