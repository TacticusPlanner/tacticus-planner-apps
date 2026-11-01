import { act, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { CurrentUserState } from "@/entities/account"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { language: language() } }),
}))

const isAuthenticated = vi.fn(() => true)
vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => isAuthenticated(),
}))

const theme = vi.fn<() => "light" | "dark" | "system">(() => "light")
vi.mock("@/shared/theme", () => ({
  useTheme: () => ({ theme: theme() }),
}))

const language = vi.fn(() => "en")

const useCurrentUserMock = vi.fn<() => { state: CurrentUserState }>(() => ({
  state: { status: "loading" },
}))
const fetchUserJotToken = vi.fn()
vi.mock("@/entities/account", () => ({
  useCurrentUser: () => useCurrentUserMock(),
  accountQueries: { userJotToken: () => ({ queryKey: ["userjot-token"] }) },
}))

const fetchQueryMock = vi.fn()
// Stable like the real client, so identify() is not recreated on every render.
const queryClient = { fetchQuery: fetchQueryMock }
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => queryClient,
}))

import { UserJotProvider, useUserJot } from "./userjot-provider"

function Consumer({ use = useUserJot }: { use?: typeof useUserJot }) {
  const { open, unreadCount, status } = use()
  return (
    <button data-testid="consumer" data-status={status} onClick={() => open()}>
      {unreadCount}
    </button>
  )
}

const sdkScript = () =>
  document.head.querySelector<HTMLScriptElement>(
    'script[src="https://cdn.userjot.com/sdk/v3/uj.js"]'
  )

function renderProvider() {
  return render(
    <UserJotProvider>
      <Consumer />
    </UserJotProvider>
  )
}

describe("UserJotProvider", () => {
  const listeners = new Map<string, (payload?: unknown) => void>()
  const identify = vi.fn().mockResolvedValue({ identityTrust: "signed" })
  const logout = vi.fn()
  const open = vi.fn()
  const setTheme = vi.fn()
  const setLocale = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    isAuthenticated.mockReturnValue(true)
    theme.mockReturnValue("light")
    language.mockReturnValue("en")
    useCurrentUserMock.mockReturnValue({
      state: {
        status: "success",
        user: {
          applicationUserId: "user-1",
          displayName: "Ada",
          suggestedDisplayName: null,
          hasCompletedOnboarding: true,
          tacticusApiKeyMasked: null,
          tacticusUserIdMasked: null,
          analyticsId: "analytics-id-1",
        },
      },
    })
    fetchQueryMock.mockReset().mockResolvedValue({ token: "signed-jwt" })
    fetchUserJotToken.mockReset()
    identify.mockClear().mockResolvedValue({ identityTrust: "signed" })
    logout.mockClear()
    open.mockClear()
    setTheme.mockClear()
    setLocale.mockClear().mockResolvedValue(undefined)
    listeners.clear()

    window.uj = {
      open,
      identify,
      logout,
      setTheme,
      setLocale,
      on: (event, handler) => {
        listeners.set(event, handler)
        return () => listeners.delete(event)
      },
    }
  })

  afterEach(() => {
    delete window.uj
    document.head
      .querySelectorAll('script[src*="userjot"]')
      .forEach((script) => script.remove())
  })

  describe("SDK loading", () => {
    // The SDK load is page-wide; each test starts from a fresh module (a fresh page).
    async function freshProvider() {
      vi.resetModules()
      const module = await import("./userjot-provider")
      return render(
        <module.UserJotProvider>
          <Consumer use={module.useUserJot} />
        </module.UserJotProvider>
      )
    }

    it("loads the SDK in the background for a signed-in user and reports it ready", async () => {
      await freshProvider()

      expect(sdkScript()).not.toBeNull()
      expect(screen.getByTestId("consumer")).toHaveAttribute(
        "data-status",
        "loading"
      )
      act(() => {
        sdkScript()!.dispatchEvent(new Event("load"))
      })
      await waitFor(() =>
        expect(screen.getByTestId("consumer")).toHaveAttribute(
          "data-status",
          "ready"
        )
      )
    })

    it("loads nothing for an anonymous visitor until they open the widget", async () => {
      isAuthenticated.mockReturnValue(false)
      useCurrentUserMock.mockReturnValue({ state: { status: "idle" } })
      await freshProvider()
      expect(sdkScript()).toBeNull()

      act(() => screen.getByTestId("consumer").click())

      expect(sdkScript()).not.toBeNull()
      expect(open).toHaveBeenCalledOnce()
    })

    it("inits the widget never to pop updates open by itself", async () => {
      delete window.uj
      delete window.$ujq
      vi.resetModules()
      await import("./userjot-provider")

      // Re-read: TS narrows `window.$ujq` to never after the `delete` above.
      const queued = window.$ujq as unknown[][] | undefined
      const init = queued?.find(([method]) => method === "init")
      expect(init?.[2]).toMatchObject({
        widget: { notifications: { updates: "none" } },
      })
    })

    it("reports failed without throwing when the SDK cannot load", async () => {
      await freshProvider()

      act(() => {
        sdkScript()!.dispatchEvent(new Event("error"))
      })

      await waitFor(() =>
        expect(screen.getByTestId("consumer")).toHaveAttribute(
          "data-status",
          "failed"
        )
      )
    })
  })

  it("identifies the signed-in user with a token from the API", async () => {
    renderProvider()

    await waitFor(() => {
      expect(identify).toHaveBeenCalledWith({ token: "signed-jwt" })
    })
    expect(logout).not.toHaveBeenCalled()
  })

  it("re-identifies with a freshly fetched token after the confirmed name changes", async () => {
    const { rerender } = renderProvider()
    await waitFor(() => expect(identify).toHaveBeenCalledTimes(1))

    useCurrentUserMock.mockReturnValue({
      state: {
        status: "success",
        user: {
          applicationUserId: "user-1",
          displayName: "Commander Ada",
          suggestedDisplayName: null,
          hasCompletedOnboarding: true,
          tacticusApiKeyMasked: null,
          tacticusUserIdMasked: null,
          analyticsId: "analytics-id-1",
        },
      },
    })
    fetchQueryMock.mockResolvedValue({ token: "fresh-jwt" })
    rerender(
      <UserJotProvider>
        <Consumer />
      </UserJotProvider>
    )

    await waitFor(() =>
      expect(identify).toHaveBeenLastCalledWith({ token: "fresh-jwt" })
    )
    expect(identify).toHaveBeenCalledTimes(2)
  })

  it("clears the widget identity when signed out", async () => {
    isAuthenticated.mockReturnValue(false)
    useCurrentUserMock.mockReturnValue({ state: { status: "idle" } })
    renderProvider()

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1)
    })
    expect(identify).not.toHaveBeenCalled()
  })

  it("stays anonymous without throwing when the token fetch fails", async () => {
    fetchQueryMock.mockRejectedValue(new Error("network down"))
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    renderProvider()

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled()
    })
    expect(identify).not.toHaveBeenCalled()
    expect(logout).toHaveBeenCalledTimes(1)

    consoleError.mockRestore()
  })

  it("syncs the widget theme to the app's theme, mapping 'system' to 'auto'", () => {
    theme.mockReturnValue("system")
    renderProvider()

    expect(setTheme).toHaveBeenCalledWith("auto")
  })

  it("syncs the widget locale to the active UI language", () => {
    language.mockReturnValue("fr")
    renderProvider()

    expect(setLocale).toHaveBeenCalledWith("fr")
  })

  it("does not apply a stale identify that resolves after signing out mid-fetch", async () => {
    let resolveToken!: (value: { token: string }) => void
    fetchQueryMock.mockReturnValue(
      new Promise<{ token: string }>((resolve) => {
        resolveToken = resolve
      })
    )

    const { rerender } = renderProvider()

    await waitFor(() => {
      expect(fetchQueryMock).toHaveBeenCalledTimes(1)
    })

    // Sign out while the first user's token fetch is still in flight.
    isAuthenticated.mockReturnValue(false)
    useCurrentUserMock.mockReturnValue({ state: { status: "idle" } })
    rerender(
      <UserJotProvider>
        <Consumer />
      </UserJotProvider>
    )

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1)
    })

    // The stale fetch for the signed-out user resolves after logout already ran.
    await act(async () => {
      resolveToken({ token: "stale-jwt" })
      await Promise.resolve()
    })

    expect(identify).not.toHaveBeenCalled()
  })

  // Every identify() makes the SDK clear its caches and abort in-flight loads, which broke the
  // page the widget was loading on its first open.
  it("does not re-identify on open while the signed identity is fresh", async () => {
    renderProvider()

    await waitFor(() => {
      expect(identify).toHaveBeenCalledTimes(1)
    })

    listeners.get("open")?.()
    await Promise.resolve()

    expect(fetchQueryMock).toHaveBeenCalledTimes(1)
    expect(identify).toHaveBeenCalledTimes(1)
  })

  it("logs out and retries on the next open when a signed identify fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    fetchQueryMock.mockRejectedValueOnce(new Error("network"))
    renderProvider()

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1)
    })
    expect(identify).not.toHaveBeenCalled()

    listeners.get("open")?.()

    await waitFor(() => {
      expect(identify).toHaveBeenCalledWith({ token: "signed-jwt" })
    })
    consoleError.mockRestore()
  })

  it("re-identifies on open once the signed identity is near its one-hour expiry", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(0)
    renderProvider()

    await waitFor(() => {
      expect(identify).toHaveBeenCalledTimes(1)
    })

    now.mockReturnValue(50 * 60 * 1000)
    fetchQueryMock.mockResolvedValue({ token: "second-jwt" })
    listeners.get("open")?.()

    await waitFor(() => {
      expect(identify).toHaveBeenCalledWith({ token: "second-jwt" })
    })
    now.mockRestore()
  })

  // Before the SDK loads, `on` is the queueing stub: it returns no unsubscribe and every handler
  // it was given is attached once the SDK runs.
  it("re-identifies on open without a stale signed-out handler logging out first", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(0)
    const openHandlers: Array<() => void> = []
    window.uj!.on = (event, handler) => {
      if (event === "open") openHandlers.push(handler as () => void)
      return undefined as unknown as () => void
    }
    useCurrentUserMock.mockReturnValue({ state: { status: "loading" } })
    const { rerender } = renderProvider()

    useCurrentUserMock.mockReturnValue({
      state: {
        status: "success",
        user: {
          applicationUserId: "user-1",
          displayName: "Ada",
          suggestedDisplayName: null,
          hasCompletedOnboarding: true,
          tacticusApiKeyMasked: null,
          tacticusUserIdMasked: null,
          analyticsId: "analytics-id-1",
        },
      },
    })
    rerender(
      <UserJotProvider>
        <Consumer />
      </UserJotProvider>
    )
    await waitFor(() => {
      expect(identify).toHaveBeenCalledTimes(1)
    })
    logout.mockClear()
    identify.mockClear()
    now.mockReturnValue(50 * 60 * 1000)

    openHandlers.forEach((handler) => handler())

    await waitFor(() => {
      expect(identify).toHaveBeenCalledTimes(1)
    })
    expect(logout).not.toHaveBeenCalled()
    now.mockRestore()
  })

  it("exposes the widget's unread count from its 'unread' event", () => {
    renderProvider()

    expect(screen.getByTestId("consumer")).toHaveTextContent("0")

    act(() => {
      listeners.get("unread")?.({ count: 3 })
    })

    expect(screen.getByTestId("consumer")).toHaveTextContent("3")
  })

  it("re-reads the unread count from the widget state when it closes", () => {
    renderProvider()

    act(() => {
      listeners.get("unread")?.({ count: 2 })
    })
    expect(screen.getByTestId("consumer")).toHaveTextContent("2")

    act(() => {
      listeners.get("close")?.({ unreadCount: 0 })
    })
    expect(screen.getByTestId("consumer")).toHaveTextContent("0")
  })

  it("keeps the unread count when the closed widget has not fetched it yet", () => {
    renderProvider()

    act(() => {
      listeners.get("unread")?.({ count: 2 })
      listeners.get("close")?.({ unreadCount: null })
    })
    expect(screen.getByTestId("consumer")).toHaveTextContent("2")
  })

  describe("Android Back", () => {
    // A stand-in for the browser's CloseWatcher: Back runs the newest live watcher's onclose.
    let watchers: { onclose: (() => void) | null; destroyed: boolean }[]

    beforeEach(() => {
      watchers = []
      vi.stubGlobal(
        "CloseWatcher",
        class {
          onclose: (() => void) | null = null
          destroyed = false
          constructor() {
            watchers.push(this)
          }
          destroy() {
            this.destroyed = true
          }
        }
      )
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    const live = () => watchers.filter((watcher) => !watcher.destroyed)

    it("closes the open widget instead of leaving the page", () => {
      const close = vi.fn()
      window.uj = { ...window.uj!, close }
      renderProvider()

      act(() => listeners.get("open")?.())
      expect(live()).toHaveLength(1)

      live()[0]?.onclose?.()
      expect(close).toHaveBeenCalledOnce()
    })

    it("stops watching Back once the widget closes itself", () => {
      window.uj = { ...window.uj!, close: vi.fn() }
      renderProvider()

      act(() => listeners.get("open")?.())
      act(() => listeners.get("close")?.({ unreadCount: 0 }))
      expect(live()).toHaveLength(0)
    })

    it("leaves Back alone when the SDK has no close to call", () => {
      renderProvider()

      act(() => listeners.get("open")?.())
      expect(watchers).toHaveLength(0)
    })
  })
})
