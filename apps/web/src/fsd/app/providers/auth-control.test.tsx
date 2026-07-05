import { fireEvent, render, screen } from "@testing-library/react"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { InteractionStatus } from "@azure/msal-browser"

import type { CurrentUserState } from "@/entities/account"

const isMobile = vi.fn(() => false)
const useCurrentUser = vi.fn<
  () => { refetch: () => void; state: CurrentUserState }
>(() => ({
  refetch: vi.fn(),
  state: { status: "loading" },
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => isMobile(),
}))

vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => true,
  useMsal: () => ({
    accounts: [
      {
        homeAccountId: "acc-1",
        name: "Test User",
        username: "test@example.com",
      },
    ],
    inProgress: InteractionStatus.None,
    instance: {
      getActiveAccount: () => ({
        homeAccountId: "acc-1",
        name: "Test User",
        username: "test@example.com",
      }),
      logoutRedirect: vi.fn().mockResolvedValue(undefined),
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

// The real module re-exports `@/shared/config`, whose i18n setup calls `initReactI18next` at
// import time — incompatible with the plain `useTranslation` mock above. Only `ApiError`'s
// identity is used here (for the account-error branch, not exercised by these tests).
vi.mock("@/shared/api", () => ({ ApiError: class ApiError extends Error {} }))

vi.mock("@/shared/auth", () => ({
  isInteractionRequired: () => false,
  loginRequest: { scopes: ["api"] },
  requestApiAccess: vi.fn(),
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
}))

import { AuthControl } from "./auth-control"

describe("AuthControl", () => {
  beforeEach(() => {
    isMobile.mockReturnValue(false)
    useCurrentUser.mockReturnValue({
      refetch: vi.fn(),
      state: { status: "loading" },
    })
  })

  it("opens a user menu with manage-account and sign-out on desktop", () => {
    render(<AuthControl />)

    expect(screen.queryByTestId("auth-sign-out")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    expect(screen.getByTestId("auth-manage-account")).toBeVisible()
    expect(screen.getByTestId("auth-sign-out")).toBeVisible()
    expect(screen.queryByTestId("theme-switcher")).not.toBeInTheDocument()
    expect(screen.queryByTestId("language-switcher")).not.toBeInTheDocument()
  })

  it("also surfaces theme and language switchers in the user menu on mobile", () => {
    isMobile.mockReturnValue(true)
    render(<AuthControl />)

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    expect(screen.getByTestId("auth-sign-out")).toBeVisible()
    expect(screen.getByTestId("theme-switcher")).toBeVisible()
    expect(screen.getByTestId("language-switcher")).toBeVisible()
  })

  it("opens the manage-account dialog when the menu item is clicked", () => {
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
    render(<AuthControl />)

    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    fireEvent.click(screen.getByTestId("auth-manage-account"))

    expect(screen.getByTestId("manage-account-dialog-stub")).toBeVisible()
  })

  it("renders the sidebar profile row with initials and display name but no email", () => {
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

    render(
      <TooltipProvider>
        <AuthControl variant="sidebar" />
      </TooltipProvider>
    )

    expect(screen.getByTestId("auth-account-avatar")).toHaveTextContent("TU")
    expect(screen.getByTestId("auth-account-name")).toHaveTextContent(
      "Test User"
    )
    expect(screen.queryByTestId("auth-account-email")).not.toBeInTheDocument()
    expect(screen.getByTestId("auth-account-trigger")).toHaveAttribute(
      "title",
      "Test User"
    )
  })
})
