import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

const signIn = vi.fn()
const isAuthenticated = vi.fn(() => false)
const isUiKitEnabled = vi.fn(() => true)

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => isAuthenticated(),
}))

vi.mock("@/shared/auth", () => ({
  useSignInRedirect: () => ({ checkingSignIn: false, disabled: false, signIn }),
}))

vi.mock("@/shared/config", () => ({
  DISCORD_INVITE_URL: "https://discord.example",
  GITHUB_ORG_URL: "https://github.example",
  get isUiKitEnabled() {
    return isUiKitEnabled()
  },
}))

vi.mock("@/widgets/account-menu", () => ({
  GuestPreferencesCard: () => <div>preferences</div>,
  USERJOT_BOARD_URL: "https://board.example",
}))

import { PublicLayout } from "./public-layout"

function renderLayout(pageTitle?: string) {
  return render(
    <MemoryRouter>
      <PublicLayout pageTitle={pageTitle}>
        <p>page body</p>
      </PublicLayout>
    </MemoryRouter>
  )
}

describe("PublicLayout", () => {
  beforeEach(() => {
    signIn.mockClear()
    isAuthenticated.mockReturnValue(false)
    isUiKitEnabled.mockReturnValue(true)
  })

  it("renders the page inside the one main landmark", () => {
    renderLayout()

    expect(
      within(screen.getByRole("main")).getByText("page body")
    ).toBeVisible()
  })

  it("offers sign-in to a signed-out visitor", () => {
    renderLayout()

    fireEvent.click(screen.getByRole("button", { name: "auth.signIn" }))

    expect(signIn).toHaveBeenCalledOnce()
    expect(
      screen.queryByRole("link", { name: "publicSite.openPlanner" })
    ).not.toBeInTheDocument()
  })

  it("offers the planner to a signed-in visitor instead of sign-in", () => {
    isAuthenticated.mockReturnValue(true)
    renderLayout()

    expect(
      screen.getByRole("link", { name: "publicSite.openPlanner" })
    ).toHaveAttribute("href", "/home")
    expect(
      screen.queryByRole("button", { name: "auth.signIn" })
    ).not.toBeInTheDocument()
  })

  it("links the Library from the top bar", () => {
    renderLayout()

    expect(
      screen.getByRole("link", { name: "library:section.label" })
    ).toHaveAttribute("href", "/library/characters")
  })

  it("carries the disclaimer and project links in the footer", () => {
    renderLayout()

    const footer = screen.getByRole("contentinfo")
    expect(within(footer).getByText("publicSite.disclaimer")).toBeVisible()
    for (const [name, href] of [
      ["publicSite.discord", "https://discord.example"],
      ["publicSite.github", "https://github.example"],
      ["publicSite.feedback", "https://board.example"],
    ]) {
      const link = within(footer).getByRole("link", { name })
      expect(link).toHaveAttribute("href", href)
      expect(link).toHaveAttribute("target", "_blank")
      expect(link).toHaveAttribute("rel", "noopener noreferrer")
    }
    expect(
      within(footer).getByRole("link", { name: "publicSite.privacy" })
    ).toHaveAttribute("href", "/privacy")
    expect(
      within(footer).getByRole("link", { name: "publicSite.uiKit" })
    ).toHaveAttribute("href", "/ui-kit")
  })

  it("hides the UI Kit link in production", () => {
    isUiKitEnabled.mockReturnValue(false)
    renderLayout()

    expect(
      screen.queryByRole("link", { name: "publicSite.uiKit" })
    ).not.toBeInTheDocument()
  })

  it("titles the document with the page and app names", () => {
    renderLayout("Privacy")

    expect(document.title).toBe("Privacy | app.name")
  })
})
