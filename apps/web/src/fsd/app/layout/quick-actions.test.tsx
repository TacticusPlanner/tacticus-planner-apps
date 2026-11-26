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
vi.mock("@/shared/player-data-status", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/player-data-status")>()),
  usePlayerDataStatus: () => ({
    status: sync.isSyncing ? "syncing" : "ready",
    syncBlockedUntil: null,
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
const signOut = vi.hoisted(() => vi.fn(() => Promise.resolve()))
vi.mock("@/shared/auth", () => ({
  useSignInRedirect: () => signInRedirect,
  signOut,
}))

const msal = vi.hoisted(() => ({
  accounts: [{ homeAccountId: "account-1" }],
  inProgress: "none",
  instance: { getActiveAccount: () => null },
}))
vi.mock("@azure/msal-react", () => ({ useMsal: () => msal }))

const setTheme = vi.hoisted(() => vi.fn())
vi.mock("@/shared/theme", () => ({ useTheme: () => ({ setTheme }) }))

const requestAccountSettings = vi.hoisted(() => vi.fn())
vi.mock("../providers/account-settings-request", () => ({
  requestAccountSettings,
}))

import type { QuickAction } from "./quick-actions"
import { useQuickActions } from "./use-quick-actions"
import { hasNode } from "@/shared/lib"

describe("useQuickActions", () => {
  const onCreateGoal = vi.fn()
  const onCreateProject = vi.fn()
  const onCreateGoalFor = vi.fn()
  const setup = (isAuthenticated = true) =>
    renderHook(
      (props: { isAuthenticated: boolean }) =>
        useQuickActions({
          ...props,
          onCreateGoal,
          onCreateGoalFor,
          onCreateProject,
        }),
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
    msal.inProgress = "none"
    document.documentElement.classList.remove("dark")
  })

  it("lists the actions in order for a signed-in user on a page with a tour", () => {
    const { result } = setup()

    expect(ids(result)).toEqual([
      "createGoal",
      "createProject",
      "sync",
      "feedback",
      "reportBug",
      "tourPage",
      "switchTheme",
      "accountSettings",
      "signOut",
    ])
    // Listed only when searched for, so the resting list stays short.
    expect(
      result.current.actions.filter((a) => a.searchOnly).map((a) => a.id)
    ).toEqual(["reportBug", "switchTheme", "accountSettings", "signOut"])
    expect(
      result.current.actions.every((a) => !hasNode(a.disabledReason))
    ).toBe(true)
  })

  it("gives guests Sign in and Sign up instead of account actions, and hides an absent page tour", () => {
    tour.hasPageTour = false
    const { result } = setup(false)

    expect(ids(result)).toEqual([
      "signIn",
      "signUp",
      "feedback",
      "reportBug",
      "switchTheme",
    ])
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
    expect(byId("reportBug")?.disabledReason).toBe(
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
    expect(userJot.open).toHaveBeenCalledExactlyOnceWith({ to: "feedback" })
    expect(tour.startPageTour).toHaveBeenCalledTimes(1)
  })

  it("opens the widget's submit form from Report a bug", () => {
    const { result } = setup()

    result.current.select("reportBug")
    act(() => result.current.flush())

    expect(userJot.open).toHaveBeenCalledWith({
      to: "feedback",
      compose: true,
    })
  })

  it("switches to the theme opposite the one showing", () => {
    document.documentElement.classList.add("dark")
    const { result } = setup()

    result.current.select("switchTheme")
    act(() => result.current.flush())

    expect(setTheme).toHaveBeenCalledExactlyOnceWith("light")
  })

  it("opens Account settings and signs out of the active account", () => {
    const { result } = setup()

    result.current.select("accountSettings")
    act(() => result.current.flush())
    result.current.select("signOut")
    act(() => result.current.flush())

    expect(requestAccountSettings).toHaveBeenCalledTimes(1)
    expect(signOut).toHaveBeenCalledExactlyOnceWith(msal.instance, "account-1")
  })

  it("disables Sign out while an account interaction is running", () => {
    msal.inProgress = "logout"
    const { result } = setup()

    expect(result.current.select("signOut")).toBe(false)
    expect(
      result.current.actions.find((a) => a.id === "signOut")?.disabledReason
    ).toBe("nav.quickActions.accountBusy")
  })

  it("opens the goal form for a unit once, and only for a signed-in user", () => {
    const unit = { entityType: "Character", entityId: "ultraCalgar" } as const
    const { result, rerender } = setup()

    expect(result.current.select({ createGoalFor: unit as never })).toBe(true)
    act(() => result.current.flush())
    expect(onCreateGoalFor).toHaveBeenCalledExactlyOnceWith(unit)

    rerender({ isAuthenticated: false })
    expect(result.current.select({ createGoalFor: unit as never })).toBe(false)
  })

  it("re-checks eligibility at dispatch: authentication lost after selection", () => {
    const { result, rerender } = setup()

    result.current.select("sync")
    rerender({ isAuthenticated: false })
    act(() => result.current.flush())

    expect(sync.syncNow).not.toHaveBeenCalled()
  })
})
