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
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ fetchQuery: fetchQueryMock }),
}))

import { UserJotProvider, useUserJot } from "./userjot-provider"

function Consumer() {
  const { open, unreadCount } = useUserJot()
  return (
    <button data-testid="consumer" onClick={() => open()}>
      {unreadCount}
    </button>
  )
}

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
  })

  it("identifies the signed-in user with a token from the API", async () => {
    renderProvider()

    await waitFor(() => {
      expect(identify).toHaveBeenCalledWith({ token: "signed-jwt" })
    })
    expect(logout).not.toHaveBeenCalled()
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
    expect(logout).not.toHaveBeenCalled()

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

  it("re-identifies when the widget is opened", async () => {
    renderProvider()

    await waitFor(() => {
      expect(identify).toHaveBeenCalledTimes(1)
    })

    fetchQueryMock.mockResolvedValue({ token: "second-jwt" })
    listeners.get("open")?.()

    await waitFor(() => {
      expect(identify).toHaveBeenCalledWith({ token: "second-jwt" })
    })
  })

  it("exposes the widget's unread count from its 'unread' event", () => {
    renderProvider()

    expect(screen.getByTestId("consumer")).toHaveTextContent("0")

    act(() => {
      listeners.get("unread")?.({ count: 3 })
    })

    expect(screen.getByTestId("consumer")).toHaveTextContent("3")
  })
})
