import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const tour = vi.hoisted(() => ({
  hasPageTour: true,
  isRunning: false,
  startPageTour: vi.fn(),
}))
vi.mock("@/shared/tour", () => ({ useTour: () => tour }))

const sync = vi.hoisted(() => ({
  isSyncing: false,
  statusText: "Syncing 1/2",
  syncNow: vi.fn(),
}))
vi.mock("../providers/player-data-sync-button", () => ({
  usePlayerDataSyncStatus: () => sync,
}))

const userJot = vi.hoisted(() => ({ open: vi.fn(), isReady: true }))
vi.mock("../providers/userjot-provider", () => ({
  useUserJot: () => userJot,
}))

import { filterQuickActions, type QuickAction } from "./quick-actions"
import { useQuickActions } from "./use-quick-actions"

const action = (overrides: Partial<QuickAction>): QuickAction => ({
  id: "sync",
  icon: (() => null) as unknown as QuickAction["icon"],
  label: "Sync with Tacticus",
  description: "Refresh your Planner",
  keywords: ["api"],
  ...overrides,
})

describe("filterQuickActions", () => {
  const actions = [
    action({}),
    action({
      id: "createProject",
      label: "New project",
      description: "Blank form",
      keywords: [],
    }),
  ]

  it("keeps everything for an empty or whitespace-only query", () => {
    expect(filterQuickActions(actions, "")).toHaveLength(2)
    expect(filterQuickActions(actions, "   ")).toHaveLength(2)
  })

  it("matches trimmed, case-insensitive label, description, and keyword text", () => {
    expect(filterQuickActions(actions, " PROJECT ")).toEqual([actions[1]])
    expect(filterQuickActions(actions, "refresh")).toEqual([actions[0]])
    expect(filterQuickActions(actions, "  Api ")).toEqual([actions[0]])
  })

  it("returns nothing when no action matches", () => {
    expect(filterQuickActions(actions, "zzz")).toEqual([])
  })
})

describe("useQuickActions", () => {
  const onCreateGoal = vi.fn()
  const onCreateProject = vi.fn()
  const setup = (isAuthenticated = true) =>
    renderHook(
      (props: { isAuthenticated: boolean }) =>
        useQuickActions({ ...props, onCreateGoal, onCreateProject }),
      { initialProps: { isAuthenticated } }
    )
  const ids = (result: { current: { actions: QuickAction[] } }) =>
    result.current.actions.map((a) => a.id)

  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(tour, { hasPageTour: true, isRunning: false })
    Object.assign(sync, { isSyncing: false })
    Object.assign(userJot, { isReady: true })
  })

  it("lists the five actions in order for a signed-in user on a page with a tour", () => {
    const { result } = setup()

    expect(ids(result)).toEqual([
      "createGoal",
      "createProject",
      "sync",
      "feedback",
      "tourPage",
    ])
    expect(result.current.actions.every((a) => !a.disabledReason)).toBe(true)
  })

  it("hides authenticated actions for guests and the page tour when none is registered", () => {
    tour.hasPageTour = false
    const { result } = setup(false)

    expect(ids(result)).toEqual(["feedback"])
  })

  it("disables sync with its status while syncing, and never starts a second sync", () => {
    sync.isSyncing = true
    const { result } = setup()

    expect(result.current.actions.find((a) => a.id === "sync")).toMatchObject({
      disabledReason: "Syncing 1/2",
    })
    expect(result.current.select("sync")).toBe(false)
    act(() => result.current.flush())
    expect(sync.syncNow).not.toHaveBeenCalled()
  })

  it("disables feedback until the widget is ready and the tour while one runs", () => {
    userJot.isReady = false
    tour.isRunning = true
    const { result } = setup()
    const byId = (id: string) => result.current.actions.find((a) => a.id === id)

    expect(byId("feedback")?.disabledReason).toBe(
      "nav.quickActions.feedbackUnavailable"
    )
    expect(byId("tourPage")?.disabledReason).toBe(
      "nav.quickActions.tourRunning"
    )
    expect(result.current.select("feedback")).toBe(false)
    expect(result.current.select("tourPage")).toBe(false)
  })

  it("runs nothing on select and dispatches exactly once on flush", () => {
    const { result, rerender } = setup()

    expect(result.current.select("createProject")).toBe(true)
    expect(onCreateProject).not.toHaveBeenCalled()

    act(() => result.current.flush())
    rerender({ isAuthenticated: true })
    act(() => result.current.flush())

    expect(onCreateProject).toHaveBeenCalledTimes(1)
  })

  it("dispatches the right callbacks for each action", () => {
    const { result } = setup()

    for (const id of ["createGoal", "sync", "feedback", "tourPage"] as const) {
      result.current.select(id)
      act(() => result.current.flush())
    }

    expect(onCreateGoal).toHaveBeenCalledTimes(1)
    expect(sync.syncNow).toHaveBeenCalledTimes(1)
    expect(userJot.open).toHaveBeenCalledTimes(1)
    expect(tour.startPageTour).toHaveBeenCalledTimes(1)
  })

  it("re-checks eligibility at dispatch: authentication lost after selection", () => {
    const { result, rerender } = setup()

    result.current.select("sync")
    rerender({ isAuthenticated: false })
    act(() => result.current.flush())

    expect(sync.syncNow).not.toHaveBeenCalled()
  })
})
