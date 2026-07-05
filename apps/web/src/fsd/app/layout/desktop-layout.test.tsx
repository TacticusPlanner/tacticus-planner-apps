import { render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import { InteractionStatus } from "@azure/msal-browser"

const translations: Record<string, string> = {
  "app.name": "Tacticus Planner",
  "nav.createGoal": "Create Goal",
  "nav.syncWithTacticus": "Sync with Tacticus",
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    inProgress: InteractionStatus.None,
    instance: { loginRedirect: () => Promise.resolve() },
  }),
}))

vi.mock("@/shared/config", () => ({ isUiKitEnabled: true }))
vi.mock("@/shared/auth", () => ({ loginRequest: { scopes: ["api"] } }))

vi.mock("../providers/catalog-sync-status-badge", () => ({
  CatalogSyncStatusBadge: () => <div data-testid="catalog-sync-status" />,
}))
vi.mock("../providers/auth-control", () => ({
  AuthControl: ({ variant }: { variant?: string }) => (
    <div data-testid="auth-account" data-variant={variant}>
      Test User
    </div>
  ),
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

import { DesktopShell } from "./desktop-layout"
import type { NavItem } from "./nav-items"
import { navItems } from "./nav-items"

describe("DesktopShell", () => {
  it("has a single sidebar trigger, living inside the collapsible sidebar itself", () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
            isAuthenticated={false}
            visibleItems={navItems as NavItem[]}
            pageTitle="Home"
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    // The sidebar collapses to an icon rail rather than going off-canvas (see sidebar.tsx's "icon"
    // mode), so it stays reachable while collapsed — only one trigger is needed, and it lives in
    // the sidebar itself rather than being duplicated in the persistent content header.
    const sidebar = document.querySelector('[data-slot="sidebar"]')
    expect(sidebar).not.toBeNull()
    const sidebarTrigger = sidebar?.querySelector(
      '[data-slot="sidebar-trigger"]'
    )
    expect(sidebarTrigger).not.toBeNull()

    const inset = document.querySelector('[data-slot="sidebar-inset"]')
    expect(inset).not.toBeNull()
    expect(inset?.querySelector('[data-slot="sidebar-trigger"]')).toBeNull()

    expect(
      screen.getAllByRole("button", { name: "Toggle Sidebar" })
    ).toHaveLength(1)
  })

  it("renders sidebar actions, catalog status, and profile row while header owns global actions", () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
            isAuthenticated
            visibleItems={navItems as NavItem[]}
            pageTitle="Home"
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    const sidebar = document.querySelector('[data-slot="sidebar"]')
    expect(sidebar).not.toBeNull()
    const sidebarScope = within(sidebar as HTMLElement)

    expect(sidebarScope.getByText("Tacticus Planner")).toBeInTheDocument()
    expect(sidebarScope.getByTestId("sidebar-create-goal")).toHaveTextContent(
      "Create Goal"
    )
    expect(sidebarScope.getByTestId("sidebar-sync-tacticus")).toHaveTextContent(
      "Sync with Tacticus"
    )

    const catalogStatus = sidebarScope.getByTestId("catalog-sync-status")
    const profileRow = sidebarScope.getByTestId("sidebar-profile-row")
    expect(
      catalogStatus.compareDocumentPosition(profileRow) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(within(profileRow).getByTestId("auth-account")).toHaveAttribute(
      "data-variant",
      "sidebar"
    )
    expect(
      within(profileRow).getByRole("button", { name: "Toggle Sidebar" })
    ).toBeInTheDocument()

    expect(sidebarScope.queryByTestId("theme-switcher")).not.toBeInTheDocument()
    expect(
      sidebarScope.queryByTestId("language-switcher")
    ).not.toBeInTheDocument()
    expect(sidebarScope.queryByTestId("tour-button")).not.toBeInTheDocument()

    const headerActions = screen.getByTestId("desktop-header-actions")
    expect(within(headerActions).getByTestId("theme-switcher")).toBeVisible()
    expect(within(headerActions).getByTestId("language-switcher")).toBeVisible()
    expect(within(headerActions).getByTestId("tour-button")).toBeVisible()
  })
})
