import { useState } from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
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
const silentSignInStatus = vi.fn(() => "idle")

const changeLanguage = vi.fn()
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", resolvedLanguage: "en", changeLanguage },
  }),
}))
vi.mock("@/shared/config", () => ({
  BUY_ME_A_COFFEE_URL: "https://coffee.example",
  DISCORD_INVITE_URL: "https://discord.example",
  getSupportedLanguage: (language: string) => language,
  supportedLocales: [
    { code: "en", nativeName: "English" },
    { code: "de", nativeName: "Deutsch" },
  ],
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

vi.mock("@/features/account", () => ({
  ManageAccountDialog: ({
    open,
    initialTab,
  }: {
    open: boolean
    initialTab?: string
  }) =>
    open ? (
      <div data-tab={initialTab} data-testid="manage-account-dialog-stub" />
    ) : null,
}))

vi.mock("@/shared/auth", async () => {
  const { useEffect, useRef } = await import("react")
  const identity =
    await vi.importActual<typeof import("@/shared/auth")>("@/shared/auth")
  return {
    getAccountEmail: identity.getAccountEmail,
    getSignInMethod: identity.getSignInMethod,
    signOut: (...args: unknown[]) => signOut(...args),
    // The real hook's surface over this file's MSAL doubles: what the guest buttons read and call.
    useSignInRedirect: () => ({
      signIn: () => void loginRedirect({ scopes: ["api"] }).catch(() => {}),
      signUp: () =>
        void loginRedirect({ scopes: ["api"], prompt: "create" }).catch(
          () => {}
        ),
      disabled: inProgress() !== InteractionStatus.None,
      checkingSignIn: silentSignInStatus() === "checking",
    }),
    // The real hook, re-expressed over this file's `isInteractionRequired` / `requestApiAccess`
    // doubles so the existing once-per-error assertions below keep exercising AuthControl.
    useRequestApiAccessOnce: (
      error: unknown,
      onError: (e: unknown) => void
    ) => {
      const handling = error !== undefined && isInteractionRequired(error)
      const requested = useRef(false)
      useEffect(() => {
        if (!handling) {
          requested.current = false
          return
        }
        if (requested.current) return
        requested.current = true
        void requestApiAccess().catch(onError)
      }, [handling, error, onError])
      return handling
    },
  }
})

// Real switchers need a ThemeProvider/i18n config this test doesn't set up — only their presence
// inside the menu (mobile vs. desktop) matters here, not their internals.
vi.mock("@/widgets/account-menu/ui/theme-switcher", () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher" />,
}))
// Real badge needs a GameCatalogProvider this test doesn't set up — only its presence inside the
// menu matters here, not its internals.
vi.mock("@/widgets/account-menu/ui/catalog-sync-status-badge", () => ({
  CatalogSyncStatusBadge: () => <div data-testid="catalog-sync-status-badge" />,
}))
const openUserJot = vi.fn()
const unreadCount = vi.fn(() => 0)
vi.mock("./userjot-provider", () => ({
  useUserJot: () => ({ open: openUserJot, unreadCount: unreadCount() }),
}))
vi.mock("@/shared/tour", () => ({
  TourButton: () => <div data-testid="tour-button" />,
  useTourControlledPopoverOpen: () => {
    const [open, setOpen] = useState(false)
    return [open, setOpen] as const
  },
}))

import { AuthControl } from "./auth-control"

function Probe() {
  const location = useLocation()
  return <div data-testid="probe">{location.pathname}</div>
}

const confirmedState = {
  status: "success",
  user: {
    applicationUserId: "user-1",
    displayName: "Test User",
    suggestedDisplayName: null,
    hasCompletedOnboarding: true,
    tacticusApiKeyMasked: null,
    tacticusUserIdMasked: null,
    analyticsId: "analytics-id-1",
  },
} as const

function renderAuthControl() {
  return render(
    <MemoryRouter initialEntries={["/home"]}>
      <TooltipProvider>
        <Routes>
          <Route element={<AuthControl />} path="/home" />
          <Route element={<Probe />} path="/account/v1-import" />
        </Routes>
      </TooltipProvider>
    </MemoryRouter>
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
    silentSignInStatus.mockReturnValue("idle")
    openUserJot.mockClear()
    unreadCount.mockReturnValue(0)
    changeLanguage.mockClear()
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
    // Theme is an inline switch and language a row in the desktop card's Preferences section;
    // the language Select is not mounted there.
    expect(screen.getByTestId("theme-switcher")).toBeVisible()
    expect(screen.getByTestId("account-language-row")).toHaveTextContent(
      "English"
    )
  })

  it("opens a language picker from the Language row and switches language", () => {
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    fireEvent.click(screen.getByTestId("account-language-row"))

    expect(screen.getByRole("radio", { name: "English" })).toBeChecked()
    fireEvent.click(screen.getByTestId("account-language-de"))

    expect(changeLanguage).toHaveBeenCalledWith("de")
    // Back on the main view afterwards.
    expect(screen.getByTestId("auth-sign-out")).toBeVisible()
  })

  it("lays out identity, preferences, account, help and community groups, sign out and the footer in order", () => {
    useCurrentUser.mockReturnValue({ state: confirmedState })
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    const ids = [
      "auth-account-identity",
      "account-preferences",
      "auth-manage-account",
      "auth-v1-import",
      "auth-feedback",
      "auth-roadmap",
      "auth-changelog",
      "account-discord",
      "account-buy-me-a-coffee",
      "auth-sign-out",
      "account-privacy",
      "account-terms",
      "catalog-sync-status-badge",
    ]
    const nodes = ids.map((id) => screen.getByTestId(id))
    nodes.slice(1).forEach((node, index) => {
      expect(
        (nodes[index]?.compareDocumentPosition(node) ?? 0) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy()
    })
    // Out of scope for this layout pass: no export/restore, shortcuts, or delete rows.
    expect(screen.queryByText(/export backup|restore|delete/i)).toBeNull()
  })

  it("links Roadmap to the public roadmap in a new tab from the desktop menu", () => {
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    const roadmap = screen.getByTestId("auth-roadmap")
    expect(roadmap).toHaveAttribute(
      "href",
      "https://tacticusplanner.userjot.com/roadmap"
    )
    expect(roadmap).toHaveAttribute("target", "_blank")
    expect(roadmap).toHaveAttribute("rel", "noopener noreferrer")
    expect(roadmap).toHaveTextContent("feedback.roadmap")
  })

  it("links Discord and Buy Me a Coffee in new tabs and closes the desktop menu", () => {
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    for (const [id, href] of [
      ["account-discord", "https://discord.example"],
      ["account-buy-me-a-coffee", "https://coffee.example"],
    ] as const) {
      const link = screen.getByTestId(id)
      expect(link).toHaveAttribute("href", href)
      expect(link).toHaveAttribute("target", "_blank")
      expect(link).toHaveAttribute("rel", "noopener noreferrer")
    }
    fireEvent.click(screen.getByTestId("account-discord"))

    expect(screen.queryByTestId("account-discord")).not.toBeInTheDocument()
  })

  it("links Privacy & cookies and Terms of use and closes the desktop menu", () => {
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    expect(screen.getByTestId("account-privacy")).toHaveAttribute(
      "href",
      "/privacy"
    )
    const terms = screen.getByTestId("account-terms")
    expect(terms).toHaveAttribute("href", "/terms")
    fireEvent.click(terms)

    expect(screen.queryByTestId("account-terms")).not.toBeInTheDocument()
  })

  // Reading updates inside the widget is what marks them seen and clears the feedback button's
  // unread dot; the public updates page is another origin and never does.
  it("opens the widget's Updates and closes the desktop menu from the Changelog row", () => {
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    expect(screen.getByTestId("auth-changelog")).not.toHaveAttribute("href")
    fireEvent.click(screen.getByTestId("auth-changelog"))

    expect(openUserJot).toHaveBeenCalledWith({ to: "updates" })
    expect(screen.queryByTestId("auth-changelog")).not.toBeInTheDocument()
  })

  it("also offers Roadmap in the guest preferences menu", () => {
    useIsAuthenticated.mockReturnValue(false)
    renderAuthControl()

    fireEvent.click(screen.getByRole("button", { name: "settings.label" }))

    expect(screen.getByTestId("auth-roadmap")).toHaveAttribute(
      "href",
      "https://tacticusplanner.userjot.com/roadmap"
    )
  })

  it("opens the widget's Updates and closes the guest menu from the Changelog row", () => {
    useIsAuthenticated.mockReturnValue(false)
    renderAuthControl()

    fireEvent.click(screen.getByRole("button", { name: "settings.label" }))
    fireEvent.click(screen.getByTestId("auth-changelog"))

    expect(openUserJot).toHaveBeenCalledWith({ to: "updates" })
    expect(screen.queryByTestId("auth-changelog")).not.toBeInTheDocument()
  })

  it("opens the UserJot widget and closes the desktop menu from the Send feedback row", () => {
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    fireEvent.click(screen.getByTestId("auth-feedback"))

    expect(openUserJot).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId("auth-feedback")).not.toBeInTheDocument()
  })

  it("opens the desktop card below the trigger, right-aligned, and closes on Escape returning focus", async () => {
    isMobile.mockReturnValue(false)
    renderAuthControl()

    const trigger = screen.getByTestId("auth-account-trigger")
    trigger.focus()
    fireEvent.click(trigger)

    const card = screen.getByTestId("auth-sign-out").closest("[data-side]")
    expect(card).toHaveAttribute("data-side", "bottom")
    expect(card).toHaveAttribute("data-align", "end")
    expect(trigger).toHaveAttribute("data-state", "open")

    fireEvent.keyDown(screen.getByTestId("auth-sign-out"), { key: "Escape" })

    expect(screen.queryByTestId("auth-sign-out")).not.toBeInTheDocument()
    await vi.waitFor(() => expect(trigger).toHaveFocus())
  })

  it("shows the signed-in user's identity above the menu actions on desktop", () => {
    isMobile.mockReturnValue(false)
    useCurrentUser.mockReturnValue({ state: confirmedState })
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    const identity = screen.getByTestId("auth-account-identity")
    expect(
      within(identity).getByTestId("auth-account-avatar")
    ).toBeInTheDocument()
    expect(within(identity).getByText("Test User")).toBeInTheDocument()
    expect(within(identity).getByText("test@example.com")).toBeInTheDocument()
  })

  it("never shows a provider name or unconfirmed suggestion as the account's name", () => {
    isMobile.mockReturnValue(false)
    useCurrentUser.mockReturnValue({
      state: {
        status: "success",
        user: {
          ...confirmedState.user,
          displayName: null,
          suggestedDisplayName: "ada@example.com",
        },
      },
    })
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    const identity = screen.getByTestId("auth-account-identity")
    expect(within(identity).getByText("auth.account")).toBeInTheDocument()
    expect(screen.queryByText("ada@example.com")).not.toBeInTheDocument()
    expect(screen.queryByText("Test User")).not.toBeInTheDocument()
  })

  it("shows a loading identity, not the neutral label and email, while the account loads on desktop", () => {
    isMobile.mockReturnValue(false)
    renderAuthControl()

    const trigger = screen.getByTestId("auth-account-trigger")
    expect(trigger).toHaveAttribute("aria-busy", "true")
    expect(screen.getByTestId("auth-account-loading")).toHaveTextContent(
      "auth.accountLoading"
    )
    expect(screen.queryByTestId("auth-account-name")).not.toBeInTheDocument()
    expect(screen.getByTestId("auth-account-avatar")).toHaveAttribute(
      "data-pending",
      "true"
    )

    fireEvent.click(trigger)

    const identity = screen.getByTestId("auth-account-identity")
    expect(
      within(identity).getByTestId("auth-account-identity-loading")
    ).toHaveTextContent("auth.accountLoading")
    expect(within(identity).queryByText("auth.account")).not.toBeInTheDocument()
    expect(screen.queryByText("test@example.com")).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("auth-edit-display-name")
    ).not.toBeInTheDocument()
  })

  it("keeps the loading identity while an interaction-required error starts re-authentication", () => {
    isMobile.mockReturnValue(false)
    isInteractionRequired.mockReturnValue(true)
    useCurrentUser.mockReturnValue({
      state: { status: "error", error: new Error("interaction_required") },
    })
    renderAuthControl()

    expect(screen.getByTestId("auth-account-loading")).toBeInTheDocument()
    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    expect(screen.queryByText("test@example.com")).not.toBeInTheDocument()
  })

  it("shows a loading identity in the mobile drawer while the account loads", () => {
    isMobile.mockReturnValue(true)
    renderAuthControl()

    expect(screen.getByTestId("auth-account-avatar")).toHaveAttribute(
      "data-pending",
      "true"
    )
    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    const drawer = screen.getByTestId("auth-account-drawer")
    expect(
      within(drawer).getByTestId("auth-account-identity-loading")
    ).toBeInTheDocument()
    expect(
      within(drawer).queryByText("test@example.com")
    ).not.toBeInTheDocument()
  })

  it("replaces the loading identity with the confirmed name once the account loads", () => {
    isMobile.mockReturnValue(false)
    useCurrentUser.mockReturnValue({ state: confirmedState })
    renderAuthControl()

    expect(screen.queryByTestId("auth-account-loading")).not.toBeInTheDocument()
    expect(screen.getByTestId("auth-account-name")).toHaveTextContent(
      "Test User"
    )
    expect(screen.getByTestId("auth-account-trigger")).not.toHaveAttribute(
      "aria-busy"
    )
  })

  it("shows the game catalog status badge inside the desktop user menu", () => {
    isMobile.mockReturnValue(false)
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    expect(screen.getByTestId("catalog-sync-status-badge")).toBeInTheDocument()
  })

  it("shows the game catalog status badge inside the mobile user menu", () => {
    isMobile.mockReturnValue(true)
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    expect(screen.getByTestId("catalog-sync-status-badge")).toBeInTheDocument()
  })

  it("lays the mobile drawer out like the desktop card, plus a tour row after Send feedback", () => {
    isMobile.mockReturnValue(true)
    useCurrentUser.mockReturnValue({ state: confirmedState })
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))

    const ids = [
      "auth-account-identity",
      "account-preferences",
      "auth-manage-account",
      "auth-v1-import",
      "auth-feedback",
      "tour-button",
      "auth-roadmap",
      "auth-changelog",
      "account-discord",
      "account-buy-me-a-coffee",
      "auth-sign-out",
      "account-privacy",
      "account-terms",
      "catalog-sync-status-badge",
    ]
    const nodes = ids.map((id) => screen.getByTestId(id))
    nodes.slice(1).forEach((node, index) => {
      expect(
        (nodes[index]?.compareDocumentPosition(node) ?? 0) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy()
    })
    expect(screen.getByTestId("theme-switcher")).toBeVisible()
    expect(screen.getByTestId("account-language-row")).toBeVisible()
    expect(screen.getByTestId("auth-roadmap")).toHaveAttribute(
      "href",
      "https://tacticusplanner.userjot.com/roadmap"
    )
    expect(screen.getByTestId("auth-roadmap")).toHaveAttribute(
      "target",
      "_blank"
    )
  })

  it("opens the language picker in the mobile drawer and switches language", () => {
    isMobile.mockReturnValue(true)
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    fireEvent.click(screen.getByTestId("account-language-row"))
    fireEvent.click(screen.getByTestId("account-language-de"))

    expect(changeLanguage).toHaveBeenCalledWith("de")
    expect(screen.getByTestId("auth-sign-out")).toBeVisible()
  })

  it("opens the UserJot widget and closes the drawer from the mobile user menu", () => {
    isMobile.mockReturnValue(true)
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    expect(screen.getByTestId("auth-feedback")).toBeVisible()

    fireEvent.click(screen.getByTestId("auth-feedback"))

    expect(openUserJot).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId("auth-account-drawer")).not.toBeInTheDocument()
  })

  it("marks the mobile avatar and the drawer's Changelog row while the widget reports unread activity", () => {
    isMobile.mockReturnValue(true)
    unreadCount.mockReturnValue(1)
    renderAuthControl()

    expect(
      screen.getByTestId("auth-account-unread-indicator")
    ).toBeInTheDocument()
    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    expect(
      screen.getByTestId("auth-changelog-unread-indicator")
    ).toBeInTheDocument()
  })

  it("shows no unread dots on the mobile avatar or Changelog row without unread activity", () => {
    isMobile.mockReturnValue(true)
    renderAuthControl()

    expect(
      screen.queryByTestId("auth-account-unread-indicator")
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    expect(
      screen.queryByTestId("auth-changelog-unread-indicator")
    ).not.toBeInTheDocument()
  })

  it("closes the mobile drawer when the Roadmap row is activated", () => {
    isMobile.mockReturnValue(true)
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    fireEvent.click(screen.getByTestId("auth-roadmap"))

    expect(screen.queryByTestId("auth-account-drawer")).not.toBeInTheDocument()
  })

  it("opens the manage-account dialog when the menu item is clicked", () => {
    isMobile.mockReturnValue(false)
    useCurrentUser.mockReturnValue({
      state: {
        status: "success",
        user: {
          applicationUserId: "user-1",
          displayName: "Test User",
          suggestedDisplayName: null,
          hasCompletedOnboarding: true,
          tacticusApiKeyMasked: "••••••••abcd",
          tacticusUserIdMasked: "••••••••1234",
          analyticsId: "analytics-id-1",
        },
      },
    })
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    fireEvent.click(screen.getByTestId("auth-manage-account"))

    expect(screen.getByTestId("manage-account-dialog-stub")).toBeVisible()
  })

  it.each([false, true])(
    "opens Account settings on the profile tab from the name edit icon (mobile: %s)",
    (mobile) => {
      isMobile.mockReturnValue(mobile)
      useCurrentUser.mockReturnValue({ state: confirmedState })
      renderAuthControl()

      fireEvent.click(screen.getByTestId("auth-account-trigger"))
      fireEvent.click(screen.getByTestId("auth-edit-display-name"))

      expect(screen.getByTestId("manage-account-dialog-stub")).toHaveAttribute(
        "data-tab",
        "profile"
      )
      // The menu closes so the dialog is not opened over it.
      expect(screen.queryByTestId("auth-edit-display-name")).toBeNull()
    }
  )

  it("opens Account settings on its default tab from the menu item", () => {
    useCurrentUser.mockReturnValue({ state: confirmedState })
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    fireEvent.click(screen.getByTestId("auth-manage-account"))

    expect(screen.getByTestId("manage-account-dialog-stub")).toHaveAttribute(
      "data-tab",
      "integration"
    )
  })

  it("navigates to the dedicated V1 import page from the user menu", async () => {
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-account-trigger"))
    fireEvent.click(screen.getByTestId("auth-v1-import"))

    expect(await screen.findByTestId("probe")).toHaveTextContent(
      "/account/v1-import"
    )
  })

  it("offers Sign in and Sign up in the bar and theme selection in a guest preferences menu", () => {
    useIsAuthenticated.mockReturnValue(false)
    renderAuthControl()

    expect(screen.getByTestId("auth-sign-in")).not.toBeDisabled()
    expect(screen.getByTestId("auth-sign-up")).not.toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: "settings.label" }))

    expect(screen.getByTestId("theme-switcher")).toBeVisible()
    expect(screen.getByTestId("account-language-row")).toBeVisible()
    // No authenticated identity or account-only actions.
    expect(screen.queryByTestId("auth-sign-out")).not.toBeInTheDocument()
    expect(screen.queryByTestId("auth-manage-account")).not.toBeInTheDocument()
    expect(screen.queryByTestId("auth-account-trigger")).not.toBeInTheDocument()
  })

  it("disables sign-in and sign-up while an MSAL interaction is already in progress", () => {
    inProgress.mockReturnValue(InteractionStatus.Startup)
    useIsAuthenticated.mockReturnValue(false)
    renderAuthControl()

    expect(screen.getByTestId("auth-sign-in")).toBeDisabled()
    expect(screen.getByTestId("auth-sign-up")).toBeDisabled()
  })

  it("shows a 'checking' label while a silent restore is in progress", () => {
    useIsAuthenticated.mockReturnValue(false)
    silentSignInStatus.mockReturnValue("checking")
    renderAuthControl()

    expect(
      screen.getByRole("button", { name: "auth.checkingSignIn" })
    ).toBeInTheDocument()
  })

  it("still signs in on click while a silent restore is in progress", async () => {
    useIsAuthenticated.mockReturnValue(false)
    silentSignInStatus.mockReturnValue("checking")
    renderAuthControl()

    fireEvent.click(screen.getByRole("button", { name: "auth.checkingSignIn" }))

    await vi.waitFor(() => {
      expect(loginRedirect).toHaveBeenCalledTimes(1)
    })
  })

  it("opens the create-account step from Sign up", async () => {
    useIsAuthenticated.mockReturnValue(false)
    renderAuthControl()

    fireEvent.click(screen.getByTestId("auth-sign-up"))

    await vi.waitFor(() => {
      expect(loginRedirect).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: "create" })
      )
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
      <MemoryRouter initialEntries={["/home"]}>
        <TooltipProvider>
          <Routes>
            <Route element={<AuthControl />} path="/home" />
            <Route element={<Probe />} path="/account/v1-import" />
          </Routes>
        </TooltipProvider>
      </MemoryRouter>
    )

    expect(requestApiAccess).toHaveBeenCalledTimes(1)
  })
})
