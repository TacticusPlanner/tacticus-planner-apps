import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useHreTabViewed } from "./use-hre-tab-viewed"

const analytics = vi.hoisted(() => ({
  captureEvent: vi.fn(),
  isReady: false,
}))
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => analytics,
}))

type Props = { eventKey: string | null }
const renderViewed = (eventKey: string | null) =>
  renderHook(({ eventKey: key }: Props) => useHreTabViewed("running", 5, key), {
    initialProps: { eventKey },
  })

describe("useHreTabViewed", () => {
  beforeEach(() => {
    analytics.captureEvent.mockClear()
    analytics.isReady = false
  })

  it("reports an event shown before analytics is ready once it is", () => {
    const { rerender } = renderViewed("a")
    expect(analytics.captureEvent).not.toHaveBeenCalled()
    analytics.isReady = true
    rerender({ eventKey: "a" })
    expect(analytics.captureEvent).toHaveBeenCalledExactlyOnceWith({
      type: "hre_tab_viewed",
      eventState: "running",
      mission: 5,
    })
  })

  it("reports each event once per visit, also after switching back", () => {
    analytics.isReady = true
    const { rerender } = renderViewed("a")
    rerender({ eventKey: "b" })
    rerender({ eventKey: "a" })
    expect(analytics.captureEvent).toHaveBeenCalledTimes(2)
  })
})
