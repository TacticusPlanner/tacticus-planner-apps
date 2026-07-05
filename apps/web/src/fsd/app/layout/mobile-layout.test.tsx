import { fireEvent, render, screen, within } from "@testing-library/react"
import { Home, Palette, Search } from "lucide-react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

import type { NavItem } from "./nav-items"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    instance: { loginRedirect: () => Promise.resolve() },
  }),
}))

vi.mock("@/shared/auth", () => ({ loginRequest: { scopes: ["api"] } }))

vi.mock("../providers/auth-control", () => ({
  AuthControl: () => <div data-testid="auth-account" />,
}))
vi.mock("../providers/language-switcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}))
vi.mock("../providers/theme-switcher", () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher" />,
}))
vi.mock("@/shared/tour", () => ({
  TourButton: () => <div data-testid="tour-button" />,
}))

import { MobileShell } from "./mobile-layout"

const items: NavItem[] = [
  {
    anonymousAllowed: false,
    icon: Home,
    labelKey: "nav.home",
    mobilePlacement: "bottom",
    path: "/home",
  },
  {
    anonymousAllowed: true,
    icon: Search,
    labelKey: "nav.lookup",
    mobilePlacement: "menu",
    path: "/lookup",
  },
  {
    anonymousAllowed: true,
    icon: Palette,
    labelKey: "nav.uiKit",
    mobilePlacement: "menu",
    path: "/ui-kit",
  },
]

describe("MobileShell", () => {
  it("places Lookup and UI Kit in the bottom-left hamburger menu", () => {
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <MobileShell
          isAuthenticated={false}
          pageTitle="Home"
          visibleItems={items}
        />
      </MemoryRouter>
    )

    const bottomNav = screen.getByTestId("primary-nav")
    expect(within(bottomNav).getByText("nav.menu")).toBeInTheDocument()
    expect(within(bottomNav).getByText("nav.home")).toBeInTheDocument()
    expect(within(bottomNav).queryByText("nav.lookup")).not.toBeInTheDocument()
    expect(within(bottomNav).queryByText("nav.uiKit")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))

    const menu = screen.getByTestId("mobile-menu")
    expect(within(menu).getByText("nav.lookup")).toBeInTheDocument()
    expect(within(menu).getByText("nav.uiKit")).toBeInTheDocument()
  })
})
