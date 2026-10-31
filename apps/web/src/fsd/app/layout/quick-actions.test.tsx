import { act, render, renderHook } from "@testing-library/react"
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
vi.mock("@/features/player-data-sync", () => ({
  usePlayerDataSyncStatus: () => sync,
}))
vi.mock("@/shared/player-data-status", () => ({
  usePlayerDataStatus: () => ({
    status: sync.isSyncing ? "syncing" : "ready",
    syncNow: sync.syncNow,
  }),
}))

const userJot = vi.hoisted(() => ({
  open: vi.fn(),
  status: "ready",
}))
vi.mock("../providers/userjot-provider", () => ({
  useUserJot: () => userJot,
}))

const signInRedirect = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  disabled: false,
  checkingSignIn: false,
}))
vi.mock("@/shared/auth", () => ({
  useSignInRedirect: () => signInRedirect,
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
    Object.assign(userJot, { status: "ready" })
    signInRedirect.disabled = false
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

  it("gives guests Sign in and Sign up instead of account actions, and hides an absent page tour", () => {
    tour.hasPageTour = false
    const { result } = setup(false)

    expect(ids(result)).toEqual(["signIn", "signUp", "feedback"])
  })

  it("runs the guest's sign-in and sign-up redirects", () => {
    const { result } = setup(false)

    expect(result.current.select("signUp")).toBe(true)
    act(() => result.current.flush())
    expect(signInRedirect.signUp).toHaveBeenCalledOnce()
    expect(result.current.select("signIn")).toBe(true)
    act(() => result.current.flush())
    expect(signInRedirect.signIn).toHaveBeenCalledOnce()
  })

  it("keeps the guest's sign-in actions visible but disabled while a sign-in is running", () => {
    signInRedirect.disabled = true
    const { result } = setup(false)

    expect(
      result.current.actions.find((a) => a.id === "signIn")?.disabledReason
    ).toBe("nav.quickActions.signInBusy")
    expect(result.current.select("signIn")).toBe(false)
  })

  it("disables sync with its status while syncing, and never starts a second sync", () => {
    sync.isSyncing = true
    const { result } = setup()

    const reason = result.current.actions.find(
      (a) => a.id === "sync"
    )?.disabledReason
    expect(render(<>{reason}</>).container).toHaveTextContent("Syncing 1/2")
    expect(result.current.select("sync")).toBe(false)
    act(() => result.current.flush())
    expect(sync.syncNow).not.toHaveBeenCalled()
  })

  it("keeps feedback available while the widget has not loaded yet (opening loads it)", () => {
    userJot.status = "idle"
    const { result } = setup()

    expect(
      result.current.actions.find((a) => a.id === "feedback")?.disabledReason
    ).toBeUndefined()
  })

  it("disables feedback when the widget failed to load and the tour while one runs", () => {
    userJot.status = "failed"
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
