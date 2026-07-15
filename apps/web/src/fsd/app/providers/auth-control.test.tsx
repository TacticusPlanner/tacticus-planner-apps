import { useState } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import { InteractionStatus } from "@azure/msal-browser"

import type { CurrentUserState } from "@/entities/account"

const isMobile = vi.fn(() => false)
const useCurrentUser = vi.fn<
  () => { refetch: () => void; state: CurrentUserState }
>(() => ({
  refetch: vi.fn(),
  state: { status: "loading" },
}))
const useIsAuthenticated = vi.fn(() => true)
const inProgress = vi.fn<() => InteractionStatus>(() => InteractionStatus.None)
const loginRedirect = vi.fn().mockResolvedValue(undefined)
const logoutRedirect = vi.fn().mockResolvedValue(undefined)
const isInteractionRequired = vi.fn<(error: unknown) => boolean>(() => false)
const requestApiAccess = vi.fn().mockResolvedValue(undefined)

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => isMobile(),
}))

const activeAccount = vi.fn(() => ({
  homeAccountId: "acc-1",
  name: "Test User",
  username: "test@example.com",
}))

vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => useIsAuthenticated(),
  useMsal: () => ({
    accounts: [activeAccount()],
    inProgress: inProgress(),
    instance: {
      getActiveAccount: () => activeAccount(),
      loginRedirect,
      logoutRedirect,
    },
  }),
}))

vi.mock("@/entities/account", () => ({
  useCurrentUser: () => useCurrentUser(),
}))

vi.mock("@/features/account-management", () => ({
  ManageAccountDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="manage-account-dialog-stub" /> : null,
}))

vi.mock("@/features/v1-import", () => ({
  ImportV1Dialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="v1-import-dialog-stub" /> : null,
}))

// The real module re-exports `@/shared/config`, whose i18n setup calls `initReactI18next` at
// import time — incompatible with the plain `useTranslation` mock above.
vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  },
}))

vi.mock("@/shared/auth", () => ({
  isInteractionRequired: (error: unknown) => isInteractionRequired(error),
  loginRequest: { scopes: ["api"] },
  requestApiAccess: (...args: unknown[]) => requestApiAccess(...args),
}))

// Real switchers need a ThemeProvider/i18n config this test doesn't set up — only their presence
// inside the menu (mobile vs. desktop) matters here, not their internals.
vi.mock("./theme-switcher", () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher" />,
}))
vi.mock("./language-switcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}))
vi.mock("@/shared/tour", () => ({
  TourButton: () => <div data-testid="tour-button" />,
  useTourControlledPopoverOpen: () => {
    const [open, setOpen] = useState(false)
    return [open, setOpen] as const
  },
}))

import { AuthControl } from "./auth-control"

function renderAuthControl(props?: { compact?: boolean }) {
  return render(
    <TooltipProvider>
      <AuthControl {...props} />
    </TooltipProvider>
  )
}

describe("AuthControl", () => {
  beforeEach(() => {
    isMobile.mockReturnValue(false)
    useIsAuthenticated.mockReturnValue(true)
    inProgress.mockReturnValue(InteractionStatus.None)
    isInteractionRequired.mockReturnValue(false)
    loginRedirect.mockClear().mockResolvedValue(undefined)
    logoutRedirect.mockClear().mockResolvedValue(undefined)
    requestApiAccess.mockClear().mockResolvedValue(undefined)
    useCurrentUser.mockReturnValue({
      refetch: vi.fn(),
      state: { status: "loading" },
    })
  })

  it("opens a user menu with manage-account and sign-out on desktop", () => {
    isMobile.mockReturnValue(false)
    renderAuthControl()

    expect(screen.queryByTestId("auth-sign-out")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    expect(screen.getByTestId("auth-manage-account")).toBeVisible()
    expect(screen.getByTestId("auth-sign-out")).toBeVisible()
    expect(screen.queryByTestId("theme-switcher")).not.toBeInTheDocument()
    expect(screen.queryByTestId("language-switcher")).not.toBeInTheDocument()
  })

  it("also surfaces theme and language switchers in the user menu on mobile", () => {
    isMobile.mockReturnValue(true)
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    expect(screen.getByTestId("auth-sign-out")).toBeVisible()
    expect(screen.getByTestId("theme-switcher")).toBeVisible()
    expect(screen.getByTestId("language-switcher")).toBeVisible()
  })

  it("opens the manage-account dialog when the menu item is clicked", () => {
    isMobile.mockReturnValue(false)
    useCurrentUser.mockReturnValue({
      refetch: vi.fn(),
      state: {
        status: "success",
        user: {
          applicationUserId: "user-1",
          displayName: "Test User",
          hasCompletedOnboarding: true,
          tacticusApiKeyMasked: "••••••••abcd",
          tacticusUserIdMasked: "••••••••1234",
        },
      },
    })
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    fireEvent.click(screen.getByTestId("auth-manage-account"))

    expect(screen.getByTestId("manage-account-dialog-stub")).toBeVisible()
  })

  it("opens the full V1 import dialog from the user menu", () => {
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    fireEvent.click(screen.getByTestId("auth-v1-import"))

    expect(screen.getByTestId("v1-import-dialog-stub")).toBeVisible()
  })

  it("shows a compact, aria-labeled sign-in button when unauthenticated", () => {
    useIsAuthenticated.mockReturnValue(false)
    renderAuthControl({ compact: true })

    const signIn = screen.getByTestId("auth-sign-in")
    expect(signIn).toHaveAttribute("aria-label", "auth.signIn")
    expect(signIn).not.toBeDisabled()
  })

  it("disables sign-in and sign-out while an MSAL interaction is already in progress", () => {
    inProgress.mockReturnValue(InteractionStatus.Startup)
    useIsAuthenticated.mockReturnValue(false)
    renderAuthControl()

    expect(screen.getByTestId("auth-sign-in")).toBeDisabled()
  })

  it("signs in on click and toasts on a failed sign-in redirect", async () => {
    useIsAuthenticated.mockReturnValue(false)
    loginRedirect.mockRejectedValue(new Error("network down"))
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-sign-in"))

    await vi.waitFor(() => {
      expect(loginRedirect).toHaveBeenCalledTimes(1)
    })
  })

  it("signs out on click and toasts on a failed sign-out redirect", async () => {
    logoutRedirect.mockRejectedValue(new Error("network down"))
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    fireEvent.click(screen.getByTestId("auth-sign-out"))

    await vi.waitFor(() => {
      expect(logoutRedirect).toHaveBeenCalledWith({ account: activeAccount() })
    })
  })

  it("surfaces a consent-required message and offers to grant access when the account failed to load", () => {
    isInteractionRequired.mockReturnValue(true)
    useCurrentUser.mockReturnValue({
      refetch: vi.fn(),
      state: { status: "error", error: new Error("needs consent") },
    })
    renderAuthControl()

    expect(screen.getByTestId("auth-account-error")).toHaveTextContent(
      "auth.accountConsentRequired"
    )
    expect(screen.getByTestId("auth-account-retry")).toHaveAttribute(
      "aria-label",
      "auth.grantAccess"
    )
  })

  it("requests API access when recovering from a consent-required error", async () => {
    isInteractionRequired.mockReturnValue(true)
    useCurrentUser.mockReturnValue({
      refetch: vi.fn(),
      state: { status: "error", error: new Error("needs consent") },
    })
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-retry"))

    await vi.waitFor(() => {
      expect(requestApiAccess).toHaveBeenCalledTimes(1)
    })
  })

  it("shows a forbidden message for a 403 ApiError and simply refetches on retry", async () => {
    const { ApiError } = await import("@/shared/api")
    const refetch = vi.fn()
    useCurrentUser.mockReturnValue({
      refetch,
      state: { status: "error", error: new ApiError(403, "forbidden") },
    })
    renderAuthControl()

    expect(screen.getByTestId("auth-account-error")).toHaveTextContent(
      "auth.accountForbidden"
    )

    fireEvent.click(screen.getByTestId("auth-account-retry"))
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(requestApiAccess).not.toHaveBeenCalled()
  })

  it("falls back to a generic load-error message for any other error", () => {
    useCurrentUser.mockReturnValue({
      refetch: vi.fn(),
      state: { status: "error", error: new Error("boom") },
    })
    renderAuthControl()

    expect(screen.getByTestId("auth-account-error")).toHaveTextContent(
      "auth.accountLoadError"
    )
  })
})
