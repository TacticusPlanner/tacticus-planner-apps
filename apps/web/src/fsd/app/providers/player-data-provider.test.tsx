import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { usePlayerDataStatus } from "@/shared/player-data-status"

const sync = vi.hoisted(() => ({
  run: vi.fn(),
  refresh: vi.fn(async () => {}),
}))

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("@/shared/auth", () => ({
  acquireAccessToken: vi.fn(),
  isInteractionRequired: () => false,
  requestApiAccess: vi.fn(),
  useActiveAccountId: () => "account-1",
}))
vi.mock("@workspace/player-data", () => ({
  PlayerDataHttpClient: class {},
  // Synced a minute ago: no background sync on mount.
  getPlayerDataMetadata: async () => ({}),
  getManifestMetadata: () => ({
    updatedAt: new Date(Date.now() - 60_000).toISOString(),
  }),
  syncPlayerData: sync.run,
}))
vi.mock("@/features/player-data-sync", () => ({
  refreshServerReadsAfterSync: sync.refresh,
}))

import { PlayerDataProvider } from "./player-data-provider"

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <PlayerDataProvider baseUrl="https://api.test">
        {children}
      </PlayerDataProvider>
    </QueryClientProvider>
  )
}

describe("PlayerDataProvider", () => {
  it("refreshes the server reads (run records, plans, goals) once a sync completes, not before", async () => {
    let finish!: (value: unknown) => void
    sync.run.mockReturnValueOnce(new Promise((done) => (finish = done)))
    const { result } = renderHook(() => usePlayerDataStatus(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe("ready"))

    act(() => result.current.syncNow())
    await waitFor(() => expect(result.current.status).toBe("syncing"))
    expect(sync.refresh).not.toHaveBeenCalled()

    await act(async () =>
      finish({ status: "ready", syncedAt: new Date().toISOString() })
    )
    await waitFor(() => expect(sync.refresh).toHaveBeenCalledOnce())
  })

  it("does not refresh after a failed sync", async () => {
    sync.refresh.mockClear()
    vi.spyOn(console, "error").mockImplementation(() => {})
    sync.run.mockRejectedValueOnce(new Error("boom"))
    const { result } = renderHook(() => usePlayerDataStatus(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe("ready"))

    act(() => result.current.syncNow())
    await waitFor(() => expect(result.current.status).toBe("error"))
    expect(sync.refresh).not.toHaveBeenCalled()
  })
})
