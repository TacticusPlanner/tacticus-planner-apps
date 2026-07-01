import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { InteractionStatus } from "@azure/msal-browser"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    inProgress: InteractionStatus.None,
    instance: { loginRedirect: () => Promise.resolve() },
  }),
}))

vi.mock("@/shared/auth", () => ({ loginRequest: { scopes: ["api"] } }))

vi.mock("../providers/catalog-sync-status-badge", () => ({
  CatalogSyncStatusBadge: () => null,
}))
vi.mock("../providers/auth-control", () => ({ AuthControl: () => null }))
vi.mock("../providers/language-switcher", () => ({
  LanguageSwitcher: () => null,
}))
vi.mock("../providers/theme-switcher", () => ({ ThemeSwitcher: () => null }))

import { DesktopShell } from "./desktop-layout"
import type { NavItem } from "./nav-items"
import { navItems } from "./nav-items"

describe("DesktopShell", () => {
  it("keeps a sidebar trigger in the persistent header, outside the collapsible sidebar", () => {
    render(
      <MemoryRouter>
        <DesktopShell
          isAuthenticated={false}
          visibleItems={navItems as NavItem[]}
          pageTitle="Home"
        />
      </MemoryRouter>
    )

    // The sidebar collapses fully off-canvas (see sidebar.tsx's "offcanvas" mode), taking any
    // trigger inside it out of reach. A trigger must also live in the always-visible content
    // header so the sidebar can be re-expanded after collapsing it.
    const inset = document.querySelector('[data-slot="sidebar-inset"]')
    expect(inset).not.toBeNull()
    const headerTrigger = inset?.querySelector('[data-slot="sidebar-trigger"]')
    expect(headerTrigger).not.toBeNull()

    expect(
      screen.getAllByRole("button", { name: "Toggle Sidebar" }).length
    ).toBeGreaterThanOrEqual(1)
  })
})
