import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

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

// `./nav-items` reads `isUiKitEnabled` from the real module's barrel, which also re-exports the
// i18n setup that calls `initReactI18next` at import time — incompatible with the plain
// `useTranslation` mock above. `true` matches the non-production default so `navItems` keeps its
// UI Kit entry.
vi.mock("@/shared/config", () => ({ isUiKitEnabled: true }))

vi.mock("../providers/catalog-sync-status-badge", () => ({
  CatalogSyncStatusBadge: () => null,
}))
vi.mock("../providers/player-data-sync-button", () => ({
  PlayerDataSyncButton: () => null,
}))
vi.mock("../providers/auth-control", () => ({ AuthControl: () => null }))
vi.mock("../providers/language-switcher", () => ({
  LanguageSwitcher: () => null,
}))
vi.mock("../providers/theme-switcher", () => ({ ThemeSwitcher: () => null }))
vi.mock("@/shared/tour", () => ({ TourButton: () => null }))
vi.mock("@/shared/player-data", () => ({
  usePlayerDataStatus: () => ({
    status: "idle",
    progress: null,
    lastSyncedAt: null,
    error: null,
    syncNow: vi.fn(),
  }),
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
})
