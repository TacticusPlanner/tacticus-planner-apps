import { render, renderHook, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const identify = vi.fn()
const optInCapturing = vi.fn()
const optOutCapturing = vi.fn()
const reset = vi.fn()
const capture = vi.fn()
const client = {
  identify,
  opt_in_capturing: optInCapturing,
  opt_out_capturing: optOutCapturing,
  reset,
  capture,
}

const vendorProvider = vi.fn(
  (props: {
    apiKey: string
    options: Record<string, unknown>
    children?: React.ReactNode
  }) => <div data-testid="vendor-provider">{props.children}</div>
)
vi.mock("@posthog/react", () => ({
  PostHogProvider: (props: Parameters<typeof vendorProvider>[0]) =>
    vendorProvider(props),
  usePostHog: () => client,
}))

import { AnalyticsProvider, useAnalyticsActions } from "./analytics-provider"

afterEach(() => {
  vi.unstubAllEnvs()
  vendorProvider.mockClear()
  identify.mockClear()
  optInCapturing.mockClear()
  optOutCapturing.mockClear()
  reset.mockClear()
  capture.mockClear()
})

describe("AnalyticsProvider", () => {
  it("skips mounting the vendor SDK when no project token is configured", () => {
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "")

    render(
      <AnalyticsProvider>
        <span>content</span>
      </AnalyticsProvider>
    )

    expect(vendorProvider).not.toHaveBeenCalled()
    expect(screen.getByText("content")).toBeInTheDocument()
  })

  it("mounts the vendor SDK opted out, with no autocapture, replay, or default pageview capture", async () => {
    // initOptions.api_host is a module-level constant baked in when analytics-provider is first
    // imported, before this stub runs - stubbing alone wouldn't change an already-evaluated value.
    // Reset the module cache and re-import fresh so this render picks up the stubbed host.
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "test-token")
    vi.stubEnv("VITE_POSTHOG_HOST", "https://us.i.posthog.com")
    vi.resetModules()
    const { AnalyticsProvider: FreshAnalyticsProvider } =
      await import("./analytics-provider")

    render(
      <FreshAnalyticsProvider>
        <span>content</span>
      </FreshAnalyticsProvider>
    )

    expect(vendorProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "test-token",
        options: expect.objectContaining({
          api_host: "https://us.i.posthog.com",
          opt_out_capturing_by_default: true,
          autocapture: false,
          capture_pageview: false,
          disable_session_recording: true,
          person_profiles: "identified_only",
        }),
      })
    )
  })

  it("disables the flags/remote-config request and external dependency loading, so opt-out is actually silent", () => {
    // opt_out_capturing_by_default alone only suppresses event capture - init() still makes its
    // own /flags and remote-config requests regardless. These two options are what actually keep
    // a signed-out visitor's browser silent, per specs/product-analytics/spec.md.
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "test-token")

    render(
      <AnalyticsProvider>
        <span>content</span>
      </AnalyticsProvider>
    )

    expect(vendorProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          advanced_disable_flags: true,
          disable_external_dependency_loading: true,
        }),
      })
    )
  })
})

describe("useAnalyticsActions", () => {
  it("makes no SDK call for any action when no project token is configured", () => {
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "")
    const { result } = renderHook(() => useAnalyticsActions())

    result.current.identifyUser("analytics-id")
    result.current.clearIdentity()
    result.current.captureEvent({
      type: "page_view",
      routePattern: "/library/characters/:entityId",
      routeGroup: "/library",
      viewMode: "desktop",
    })

    expect(identify).not.toHaveBeenCalled()
    expect(optInCapturing).not.toHaveBeenCalled()
    expect(optOutCapturing).not.toHaveBeenCalled()
    expect(reset).not.toHaveBeenCalled()
    expect(capture).not.toHaveBeenCalled()
  })

  it("identifies then opts in when configured", () => {
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "test-token")
    const { result } = renderHook(() => useAnalyticsActions())

    result.current.identifyUser("analytics-id")

    expect(identify).toHaveBeenCalledWith("analytics-id")
    expect(optInCapturing).toHaveBeenCalledTimes(1)
  })

  it("opts out before resetting on teardown", () => {
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "test-token")
    const { result } = renderHook(() => useAnalyticsActions())

    result.current.clearIdentity()

    expect(optOutCapturing).toHaveBeenCalledTimes(1)
    expect(reset).toHaveBeenCalledTimes(1)
    const optOutOrder = optOutCapturing.mock.invocationCallOrder[0]
    const resetOrder = reset.mock.invocationCallOrder[0]
    expect(optOutOrder).toBeLessThan(resetOrder)
  })

  it("captures a page_view with only the declared properties", () => {
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "test-token")
    const { result } = renderHook(() => useAnalyticsActions())

    result.current.captureEvent({
      type: "page_view",
      routePattern: "/library/characters/:entityId",
      routeGroup: "/library",
      viewMode: "mobile",
    })

    expect(capture).toHaveBeenCalledWith("page_view", {
      route_pattern: "/library/characters/:entityId",
      route_group: "/library",
      view_mode: "mobile",
    })
  })
})
