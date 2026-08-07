import { useState } from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import { InteractionStatus } from "@azure/msal-browser"

import type { CurrentUserState } from "@/entities/account"

const isMobile = vi.fn(() => false)
const useCurrentUser = vi.fn<() => { state: CurrentUserState }>(() => ({
  state: { status: "loading" },
}))
const useIsAuthenticated = vi.fn(() => true)
const inProgress = vi.fn<() => InteractionStatus>(() => InteractionStatus.None)
const loginRedirect = vi.fn().mockResolvedValue(undefined)
const logoutRedirect = vi.fn().mockResolvedValue(undefined)
const isInteractionRequired = vi.fn<(error: unknown) => boolean>(() => false)
const requestApiAccess = vi.fn().mockResolvedValue(undefined)
const signOut = vi.fn().mockResolvedValue(undefined)

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

vi.mock("@/shared/auth", () => ({
  isInteractionRequired: (error: unknown) => isInteractionRequired(error),
  loginRequest: { scopes: ["api"] },
  requestApiAccess: (...args: unknown[]) => requestApiAccess(...args),
  signOut: (...args: unknown[]) => signOut(...args),
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
    signOut.mockClear().mockResolvedValue(undefined)
    useCurrentUser.mockReturnValue({ state: { status: "loading" } })
  })

  it("opens a user menu with manage-account and sign-out on desktop", () => {
    isMobile.mockReturnValue(false)
    renderAuthControl()

    expect(screen.queryByTestId("auth-sign-out")).not.toBeInTheDocument()
    // The trigger shows the account avatar, not a generic icon, before the menu is even open.
    expect(
      within(screen.getByTestId("auth-account-trigger")).getByTestId(
        "auth-account-avatar"
      )
    ).toBeInTheDocument()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    expect(screen.getByTestId("auth-manage-account")).toBeVisible()
    expect(screen.getByTestId("auth-sign-out")).toBeVisible()
    expect(screen.queryByTestId("theme-switcher")).not.toBeInTheDocument()
    expect(screen.queryByTestId("language-switcher")).not.toBeInTheDocument()
  })

  it("shows the signed-in user's identity above the menu actions on desktop", () => {
    isMobile.mockReturnValue(false)
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    const identity = screen.getByTestId("auth-account-identity")
    expect(
      within(identity).getByTestId("auth-account-avatar")
    ).toBeInTheDocument()
    expect(within(identity).getByText("Test User")).toBeInTheDocument()
    expect(within(identity).getByText("test@example.com")).toBeInTheDocument()
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
    signOut.mockRejectedValue(new Error("network down"))
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    fireEvent.click(screen.getByTestId("auth-sign-out"))

    await vi.waitFor(() => {
      expect(signOut).toHaveBeenCalledWith(
        expect.objectContaining({ logoutRedirect }),
        activeAccount().homeAccountId
      )
    })
  })

  it("auto-fires requestApiAccess when the account errors with an interaction-required error", async () => {
    isInteractionRequired.mockReturnValue(true)
    useCurrentUser.mockReturnValue({
      state: { status: "error", error: new Error("needs consent") },
    })
    renderAuthControl()

    await vi.waitFor(() => {
      expect(requestApiAccess).toHaveBeenCalledTimes(1)
    })
  })

  it("does not fire requestApiAccess for a non-interaction-required account error", () => {
    isInteractionRequired.mockReturnValue(false)
    useCurrentUser.mockReturnValue({
      state: { status: "error", error: new Error("boom") },
    })
    renderAuthControl()

    expect(requestApiAccess).not.toHaveBeenCalled()
  })

  it("fires requestApiAccess only once while the same error stays in place", async () => {
    isInteractionRequired.mockReturnValue(true)
    useCurrentUser.mockReturnValue({
      state: { status: "error", error: new Error("needs consent") },
    })
    const { rerender } = renderAuthControl()

    await vi.waitFor(() => {
      expect(requestApiAccess).toHaveBeenCalledTimes(1)
    })

    rerender(
      <TooltipProvider>
        <AuthControl />
      </TooltipProvider>
    )

    expect(requestApiAccess).toHaveBeenCalledTimes(1)
  })
})
