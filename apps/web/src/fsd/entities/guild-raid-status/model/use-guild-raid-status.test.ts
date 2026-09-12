import { createElement, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type {
  GuildRaidStatusResponse,
  GuildRaidStatusResult,
} from "../api/guild-raid-status.api"

const { getGuildRaidStatusMock, refreshGuildRaidStatusMock } = vi.hoisted(
  () => ({
    getGuildRaidStatusMock: vi.fn(),
    refreshGuildRaidStatusMock: vi.fn(),
  })
)

vi.mock("../api/guild-raid-status.api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../api/guild-raid-status.api")>()
  return {
    ...actual,
    getGuildRaidStatus: getGuildRaidStatusMock,
    refreshGuildRaidStatus: refreshGuildRaidStatusMock,
  }
})

import {
  guildRaidAutoRefreshAfterMs,
  useGuildRaidStatus,
} from "./use-guild-raid-status"

const NOW = new Date("2026-07-12T12:00:00.000Z").getTime()

function statusResponse(
  overrides: Partial<GuildRaidStatusResponse> = {}
): GuildRaidStatusResponse {
  return {
    state: "noActiveSeason",
    observedAt: new Date(NOW).toISOString(),
    freshness: "fresh",
    lastGuildSyncSucceededAt: new Date(NOW).toISOString(),
    season: null,
    ...overrides,
  }
}

function observedStatus(
  overrides: Partial<GuildRaidStatusResponse> = {}
): GuildRaidStatusResult {
  return { kind: "observed", status: statusResponse(overrides) }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  })
  return function TestWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

let nowSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  nowSpy = vi.spyOn(Date, "now").mockReturnValue(NOW)
  getGuildRaidStatusMock.mockReset()
  refreshGuildRaidStatusMock.mockReset()
})

afterEach(() => {
  nowSpy.mockRestore()
})

describe("useGuildRaidStatus", () => {
  it("does not auto-refresh when the persisted observation is recent", async () => {
    getGuildRaidStatusMock.mockResolvedValue(observedStatus())

    const { result } = renderHook(() => useGuildRaidStatus(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))

    expect(refreshGuildRaidStatusMock).not.toHaveBeenCalled()
  })

  it("auto-refreshes once on mount when the observation is over an hour old", async () => {
    const staleObservedAt = new Date(
      NOW - guildRaidAutoRefreshAfterMs - 1000
    ).toISOString()
    getGuildRaidStatusMock.mockResolvedValue(
      observedStatus({ observedAt: staleObservedAt })
    )
    refreshGuildRaidStatusMock.mockResolvedValue(
      statusResponse({ observedAt: new Date(NOW).toISOString() })
    )

    renderHook(() => useGuildRaidStatus(), { wrapper: createWrapper() })

    await waitFor(() =>
      expect(refreshGuildRaidStatusMock).toHaveBeenCalledTimes(1)
    )
  })

  it("auto-refreshes once on mount when the guild has never been observed", async () => {
    getGuildRaidStatusMock.mockResolvedValue({ kind: "neverObserved" })
    refreshGuildRaidStatusMock.mockResolvedValue(statusResponse())

    renderHook(() => useGuildRaidStatus(), { wrapper: createWrapper() })

    await waitFor(() =>
      expect(refreshGuildRaidStatusMock).toHaveBeenCalledTimes(1)
    )
  })

  it("does not check again on this mount even if the status re-fetches later", async () => {
    const staleObservedAt = new Date(
      NOW - guildRaidAutoRefreshAfterMs - 1000
    ).toISOString()
    getGuildRaidStatusMock.mockResolvedValue(
      observedStatus({ observedAt: staleObservedAt })
    )
    refreshGuildRaidStatusMock.mockResolvedValue(
      statusResponse({ observedAt: new Date(NOW).toISOString() })
    )

    const { result } = renderHook(() => useGuildRaidStatus(), {
      wrapper: createWrapper(),
    })

    await waitFor(() =>
      expect(refreshGuildRaidStatusMock).toHaveBeenCalledTimes(1)
    )

    // Simulate the underlying GET re-running later (e.g. some other cache invalidation) and still
    // reporting a stale observation — the mount-scoped guard must not fire a second forced refresh.
    nowSpy.mockReturnValue(NOW + guildRaidAutoRefreshAfterMs * 3)
    getGuildRaidStatusMock.mockResolvedValue(
      observedStatus({ observedAt: staleObservedAt })
    )
    await act(async () => {
      await result.current.query.refetch()
    })

    expect(refreshGuildRaidStatusMock).toHaveBeenCalledTimes(1)
  })

  it("treats a cooldown response (still 200) as a normal successful refresh", async () => {
    getGuildRaidStatusMock.mockResolvedValue(observedStatus())
    const refreshed = statusResponse({ freshness: "fresh" })
    refreshGuildRaidStatusMock.mockResolvedValue(refreshed)

    const { result } = renderHook(() => useGuildRaidStatus(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))

    await act(async () => {
      result.current.refresh()
    })
    await waitFor(() => expect(result.current.isRefreshing).toBe(false))

    expect(result.current.refreshError).toBeNull()
    const data = result.current.query.data
    expect(data?.kind).toBe("observed")
    expect(data?.kind === "observed" ? data.status : null).toEqual(refreshed)
  })

  it("does not start a second forced refresh while one is already pending", async () => {
    getGuildRaidStatusMock.mockResolvedValue(observedStatus())
    let resolveRefresh!: (value: GuildRaidStatusResponse) => void
    refreshGuildRaidStatusMock.mockReturnValue(
      new Promise<GuildRaidStatusResponse>((resolve) => {
        resolveRefresh = resolve
      })
    )

    const { result } = renderHook(() => useGuildRaidStatus(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))

    act(() => {
      result.current.refresh()
      result.current.refresh()
    })
    await waitFor(() => expect(result.current.isRefreshing).toBe(true))
    expect(refreshGuildRaidStatusMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveRefresh(statusResponse())
    })
  })

  it("surfaces a refresh failure without disturbing the previously loaded status", async () => {
    getGuildRaidStatusMock.mockResolvedValue(observedStatus())
    refreshGuildRaidStatusMock.mockRejectedValue(
      new Error("upstream unavailable")
    )

    const { result } = renderHook(() => useGuildRaidStatus(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
    const dataBefore = result.current.query.data

    await act(async () => {
      result.current.refresh()
    })
    await waitFor(() => expect(result.current.refreshError).not.toBeNull())

    expect(result.current.query.data).toEqual(dataBefore)
  })
})
