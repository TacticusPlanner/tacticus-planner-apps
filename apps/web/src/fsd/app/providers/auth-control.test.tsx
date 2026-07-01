import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { InteractionStatus } from "@azure/msal-browser"

const isMobile = vi.fn(() => false)

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

// Left pending on purpose — the derived account name already falls back to `account.name` while
// this is in flight, so tests don't need to wait for it to settle.
vi.mock("@/shared/auth", () => ({
  getCurrentUser: () => new Promise(() => {}),
  isInteractionRequired: () => false,
  loginRequest: { scopes: ["api"] },
  requestApiAccess: vi.fn(),
}))

// The real module re-exports `@/shared/config`, whose i18n setup calls `initReactI18next` at
// import time — incompatible with the plain `useTranslation` mock above. Only `ApiError`'s
// identity is used here (for the account-error branch, not exercised by these tests).
vi.mock("@/shared/api", () => ({ ApiError: class ApiError extends Error {} }))

// Real switchers need a ThemeProvider/i18n config this test doesn't set up — only their presence
// inside the menu (mobile vs. desktop) matters here, not their internals.
vi.mock("./theme-switcher", () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher" />,
}))
vi.mock("./language-switcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}))

import { AuthControl } from "./auth-control"

describe("AuthControl", () => {
  it("opens a user menu with only sign-out on desktop", () => {
    isMobile.mockReturnValue(false)
    render(<AuthControl />)

    expect(screen.queryByTestId("auth-sign-out")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

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
})
