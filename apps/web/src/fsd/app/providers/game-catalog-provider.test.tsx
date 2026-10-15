import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const catalog = vi.hoisted(() => ({
  sync: vi.fn(),
  hasCache: vi.fn(),
}))

vi.mock("@workspace/game-catalog", () => ({
  GameCatalogHttpClient: class {},
  syncGameCatalog: (...args: unknown[]) => catalog.sync(...args),
  hasCompleteGameCatalogCache: () => catalog.hasCache(),
}))

import {
  GameCatalogProvider,
  useGameCatalogStatus,
} from "./game-catalog-provider"

const HOUR_MS = 60 * 60 * 1000

function StatusProbe() {
  const { status, gameVersion } = useGameCatalogStatus()
  return (
    <p data-testid="probe">
      {status}:{gameVersion}
    </p>
  )
}

let visibility: DocumentVisibilityState = "visible"

function setVisibility(value: DocumentVisibilityState) {
  visibility = value
  document.dispatchEvent(new Event("visibilitychange"))
}

async function renderProvider() {
  render(
    <GameCatalogProvider baseUrl="https://api.test">
      <StatusProbe />
    </GameCatalogProvider>
  )
  await act(() => vi.advanceTimersByTimeAsync(0))
}

describe("GameCatalogProvider background re-check", () => {
  beforeEach(() => {
    catalog.sync.mockReset()
    catalog.hasCache.mockReset()
    catalog.sync.mockResolvedValue({
      status: "ready",
      gameVersion: "1.0",
      firstTime: false,
      downloaded: [],
    })
    visibility = "visible"
    vi.spyOn(document, "visibilityState", "get").mockImplementation(
      () => visibility
    )
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-10-15T08:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("re-syncs when the tab becomes visible after the last sync is over an hour old", async () => {
    await renderProvider()
    expect(catalog.sync).toHaveBeenCalledTimes(1)

    catalog.sync.mockResolvedValue({
      status: "ready",
      gameVersion: "1.1",
      firstTime: false,
      downloaded: ["events"],
    })
    vi.setSystemTime(new Date("2026-10-15T09:00:01Z"))
    setVisibility("hidden")
    setVisibility("visible")
    await act(() => vi.advanceTimersByTimeAsync(0))

    expect(catalog.sync).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId("probe")).toHaveTextContent("ready:1.1")
  })

  it("does not re-sync when the last sync is recent", async () => {
    await renderProvider()
    vi.setSystemTime(Date.now() + HOUR_MS - 1000)
    setVisibility("visible")
    await act(() => vi.advanceTimersByTimeAsync(0))

    expect(catalog.sync).toHaveBeenCalledTimes(1)
  })

  it("never re-checks while hidden, and claims the slot so repeated focus doesn't stack syncs", async () => {
    await renderProvider()
    vi.setSystemTime(Date.now() + 2 * HOUR_MS)
    setVisibility("hidden")
    expect(catalog.sync).toHaveBeenCalledTimes(1)

    setVisibility("visible")
    setVisibility("visible")
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(catalog.sync).toHaveBeenCalledTimes(2)
  })

  it("keeps the cached catalog usable and the status unchanged when the re-check fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    await renderProvider()
    catalog.sync.mockRejectedValue(new Error("offline"))
    vi.setSystemTime(Date.now() + 2 * HOUR_MS)
    setVisibility("visible")
    await act(() => vi.advanceTimersByTimeAsync(0))

    expect(catalog.sync).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId("probe")).toHaveTextContent("ready:1.0")
  })

  it("does not re-check before the initial sync has produced a usable catalog", async () => {
    catalog.sync.mockRejectedValue(new Error("down"))
    catalog.hasCache.mockResolvedValue(false)
    await renderProvider()
    expect(screen.getByTestId("probe")).toHaveTextContent("error:")

    vi.setSystemTime(Date.now() + 2 * HOUR_MS)
    setVisibility("visible")
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(catalog.sync).toHaveBeenCalledTimes(1)
  })
})
