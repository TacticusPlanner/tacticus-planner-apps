import { render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { CurrentUserState } from "@/entities/account"
import type { AnalyticsEvent } from "@/shared/analytics"

const isAuthenticated = vi.fn(() => true)
vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => isAuthenticated(),
}))

const useCurrentUserMock = vi.fn<() => { state: CurrentUserState }>(() => ({
  state: { status: "idle" },
}))
vi.mock("@/entities/account", () => ({
  useCurrentUser: () => useCurrentUserMock(),
}))

const isMobile = vi.fn(() => false)
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => isMobile(),
}))

type Match = { pathname: string; params: Record<string, string | undefined> }
const matches = vi.fn<() => Match[]>(() => [])
vi.mock("react-router", () => ({
  useMatches: () => matches(),
}))

const identifyUser = vi.fn()
const clearIdentity = vi.fn()
const captureEvent = vi.fn()
vi.mock("@/shared/analytics", () => ({
  AnalyticsProvider: ({ children }: { children: React.ReactNode }) => children,
  useAnalyticsActions: () => ({ identifyUser, clearIdentity, captureEvent }),
}))

import { PostHogProvider } from "./posthog-provider"

function successState(analyticsId: string | undefined): CurrentUserState {
  return {
    status: "success",
    user: {
      applicationUserId: "app-user-1",
      displayName: "Test User",
      suggestedDisplayName: null,
      hasCompletedOnboarding: true,
      tacticusApiKeyMasked: null,
      tacticusUserIdMasked: null,
      // Cast past the type to simulate an apps-deployed-before-api response missing the field.
      analyticsId: analyticsId as unknown as string,
    },
  }
}

function renderProvider(routeGroup: string | undefined = "/library") {
  return render(
    <PostHogProvider routeGroup={routeGroup}>
      <div>content</div>
    </PostHogProvider>
  )
}

afterEach(() => {
  vi.clearAllMocks()
  isAuthenticated.mockReturnValue(true)
  isMobile.mockReturnValue(false)
  matches.mockReturnValue([])
})

describe("PostHogProvider identity lifecycle", () => {
  it("identifies the user once signed in and their analytics id has resolved", () => {
    useCurrentUserMock.mockReturnValue({
      state: successState("analytics-id-1"),
    })

    renderProvider()

    expect(identifyUser).toHaveBeenCalledWith("analytics-id-1")
    expect(clearIdentity).not.toHaveBeenCalled()
  })

  it("clears identity when signed out", () => {
    isAuthenticated.mockReturnValue(false)
    useCurrentUserMock.mockReturnValue({ state: { status: "idle" } })

    renderProvider()

    expect(clearIdentity).toHaveBeenCalledTimes(1)
    expect(identifyUser).not.toHaveBeenCalled()
  })

  it("does not identify while authenticated but the account is still loading", () => {
    useCurrentUserMock.mockReturnValue({ state: { status: "loading" } })

    renderProvider()

    expect(identifyUser).not.toHaveBeenCalled()
    expect(clearIdentity).toHaveBeenCalledTimes(1)
  })

  it("does not identify when the account fails to load", () => {
    useCurrentUserMock.mockReturnValue({
      state: { status: "error", error: new Error("network down") },
    })

    renderProvider()

    expect(identifyUser).not.toHaveBeenCalled()
    expect(clearIdentity).toHaveBeenCalledTimes(1)
  })

  it("treats a missing analyticsId exactly like an unresolved account (apps deployed before api)", () => {
    useCurrentUserMock.mockReturnValue({ state: successState(undefined) })

    renderProvider()

    expect(identifyUser).not.toHaveBeenCalled()
    expect(clearIdentity).toHaveBeenCalledTimes(1)
  })

  it("switches identity cleanly when user A signs out and user B signs in", () => {
    useCurrentUserMock.mockReturnValue({
      state: successState("analytics-id-a"),
    })
    const { rerender } = renderProvider()
    expect(identifyUser).toHaveBeenCalledWith("analytics-id-a")

    isAuthenticated.mockReturnValue(false)
    useCurrentUserMock.mockReturnValue({ state: { status: "idle" } })
    rerender(
      <PostHogProvider routeGroup="/library">
        <div>content</div>
      </PostHogProvider>
    )
    expect(clearIdentity).toHaveBeenCalledTimes(1)

    isAuthenticated.mockReturnValue(true)
    useCurrentUserMock.mockReturnValue({
      state: successState("analytics-id-b"),
    })
    rerender(
      <PostHogProvider routeGroup="/library">
        <div>content</div>
      </PostHogProvider>
    )

    expect(identifyUser).toHaveBeenCalledWith("analytics-id-b")
    // Never attributed to A once B is the identified user.
    expect(identifyUser).not.toHaveBeenLastCalledWith("analytics-id-a")
  })
})

describe("PostHogProvider page-view capture", () => {
  it("reports the matched route pattern, not the parameter value, for identified users", () => {
    useCurrentUserMock.mockReturnValue({
      state: successState("analytics-id-1"),
    })
    matches.mockReturnValue([
      {
        pathname: "/library/characters/abc-123",
        params: { entityId: "abc-123" },
      },
    ])

    renderProvider("/library")

    expect(captureEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "page_view",
        routePattern: "/library/characters/:entityId",
      })
    )
    const [event] = captureEvent.mock.calls[0] as [AnalyticsEvent]
    expect(JSON.stringify(event)).not.toContain("abc-123")
  })

  it("redacts a multi-segment catch-all match instead of leaking the raw unmatched path", () => {
    useCurrentUserMock.mockReturnValue({
      state: successState("analytics-id-1"),
    })
    matches.mockReturnValue([
      {
        pathname: "/library/characters/abc-123/extra",
        params: { "*": "library/characters/abc-123/extra" },
      },
    ])

    renderProvider("/library")

    const [event] = captureEvent.mock.calls[0] as [AnalyticsEvent]
    expect(event).toMatchObject({ type: "page_view", routePattern: "/*" })
    expect(JSON.stringify(event)).not.toContain("abc-123")
  })

  it("derives route_group from the routeGroup prop, one per top-level section", () => {
    useCurrentUserMock.mockReturnValue({
      state: successState("analytics-id-1"),
    })
    matches.mockReturnValue([{ pathname: "/goals/overview", params: {} }])

    renderProvider("/goals")

    expect(captureEvent).toHaveBeenCalledWith(
      expect.objectContaining({ routeGroup: "/goals" })
    )
  })

  it("reports view_mode below and at/above the mobile breakpoint", () => {
    useCurrentUserMock.mockReturnValue({
      state: successState("analytics-id-1"),
    })
    matches.mockReturnValue([{ pathname: "/home", params: {} }])

    isMobile.mockReturnValue(true)
    renderProvider("/home")
    expect(captureEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({ viewMode: "mobile" })
    )

    captureEvent.mockClear()
    matches.mockReturnValue([{ pathname: "/library", params: {} }])
    isMobile.mockReturnValue(false)
    renderProvider("/library")
    expect(captureEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({ viewMode: "desktop" })
    )
  })

  it("reports no page_view for a signed-out visitor browsing anonymously-allowed routes", () => {
    isAuthenticated.mockReturnValue(false)
    useCurrentUserMock.mockReturnValue({ state: { status: "idle" } })
    matches.mockReturnValue([{ pathname: "/library", params: {} }])

    renderProvider("/library")

    expect(captureEvent).not.toHaveBeenCalled()
    expect(clearIdentity).toHaveBeenCalledTimes(1)
  })

  it("reports no page_view for a route change that happens while signed out", () => {
    isAuthenticated.mockReturnValue(false)
    useCurrentUserMock.mockReturnValue({ state: { status: "idle" } })
    matches.mockReturnValue([{ pathname: "/home", params: {} }])
    const { rerender } = renderProvider("/home")

    matches.mockReturnValue([{ pathname: "/library", params: {} }])
    rerender(
      <PostHogProvider routeGroup="/library">
        <div>content</div>
      </PostHogProvider>
    )

    expect(captureEvent).not.toHaveBeenCalled()
  })

  it("does not backfill a page_view for the route active at the moment of sign-in", () => {
    isAuthenticated.mockReturnValue(false)
    useCurrentUserMock.mockReturnValue({ state: { status: "idle" } })
    matches.mockReturnValue([{ pathname: "/library", params: {} }])
    const { rerender } = renderProvider("/library")
    expect(captureEvent).not.toHaveBeenCalled()

    // Sign in while still on the same route - the route pattern doesn't change.
    isAuthenticated.mockReturnValue(true)
    useCurrentUserMock.mockReturnValue({
      state: successState("analytics-id-1"),
    })
    rerender(
      <PostHogProvider routeGroup="/library">
        <div>content</div>
      </PostHogProvider>
    )
    expect(captureEvent).not.toHaveBeenCalled()

    // A subsequent, real navigation is reported normally.
    matches.mockReturnValue([{ pathname: "/goals", params: {} }])
    rerender(
      <PostHogProvider routeGroup="/goals">
        <div>content</div>
      </PostHogProvider>
    )
    expect(captureEvent).toHaveBeenCalledTimes(1)
  })
})
