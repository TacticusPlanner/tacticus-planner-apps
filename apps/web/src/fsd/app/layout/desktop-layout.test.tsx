import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, useLocation } from "react-router"
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

import { DesktopShell } from "./desktop-layout"
import type { NavItem } from "./nav-items"
import { navItems } from "./nav-items"
import { resolveActiveNavigation } from "./resolve-active-navigation"
import { useSectionEntryPath } from "./use-section-entry-path"

function identityEntryPath(item: NavItem) {
  return item.path
}

const homeItem = navItems.find((item) => item.path === "/home")!
const lookupItem = navItems.find((item) => item.path === "/lookup")!

// Exercises `DesktopShell` together with the real `useSectionEntryPath` hook, the same way
// `ShellContent` wires them in `app-shell.tsx`, so entry-path resolution is tested end to end.
function EntryPathHarness() {
  const { pathname } = useLocation()
  const { getEntryPath } = useSectionEntryPath(navItems as NavItem[], pathname)
  const { activeItem } = resolveActiveNavigation(
    navItems as NavItem[],
    pathname
  )

  return (
    <DesktopShell
      activeSection={activeItem}
      isAuthenticated
      visibleItems={navItems as NavItem[]}
      pageDescription="Lookup description"
      sectionTitle="Lookup"
      onCreateGoal={vi.fn()}
      getEntryPath={getEntryPath}
    />
  )
}

describe("DesktopShell", () => {
  it("has a single sidebar trigger, living inside the collapsible sidebar itself", () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
            isAuthenticated={false}
            visibleItems={navItems as NavItem[]}
            activeSection={homeItem}
            pageDescription="Home description"
            sectionTitle="Home"
            onCreateGoal={vi.fn()}
            getEntryPath={identityEntryPath}
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

  it("renders the page description beneath the page title in the header", () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
            isAuthenticated
            visibleItems={navItems as NavItem[]}
            activeSection={homeItem}
            pageDescription="Your account overview"
            sectionTitle="Home"
            onCreateGoal={vi.fn()}
            getEntryPath={identityEntryPath}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument()
    expect(screen.getByText("Your account overview")).toBeInTheDocument()
  })

  it("shows a plain '{Section} › {Active child}' breadcrumb in the header for a section with children", () => {
    render(
      <MemoryRouter initialEntries={["/lookup/mow"]}>
        <TooltipProvider>
          <DesktopShell
            isAuthenticated
            visibleItems={navItems as NavItem[]}
            activeSection={lookupItem}
            pageDescription="Machines of War description"
            sectionTitle="Lookup"
            onCreateGoal={vi.fn()}
            getEntryPath={identityEntryPath}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    const title = screen.getByTestId("section-header-title")
    expect(title).toHaveTextContent("Lookup")
    expect(title).toHaveTextContent("unitLookup.tabs.mow")
    // Child navigation no longer lives in the header at all - neither segment is interactive.
    expect(within(title).queryByRole("link")).not.toBeInTheDocument()
    expect(within(title).queryByRole("button")).not.toBeInTheDocument()
    // The description still swaps to the active child, independent of the sidebar/breadcrumb.
    expect(screen.getByText("Machines of War description")).toBeInTheDocument()
  })

  it("renders every child page as a row in the sidebar's own flyout, not the header", () => {
    render(
      <MemoryRouter initialEntries={["/lookup/mow"]}>
        <TooltipProvider>
          <DesktopShell
            isAuthenticated
            visibleItems={navItems as NavItem[]}
            activeSection={lookupItem}
            pageDescription="Lookup description"
            sectionTitle="Lookup"
            onCreateGoal={vi.fn()}
            // Real `getEntryPath` implementations never resolve to the bare, unrouted parent path
            // (see use-section-entry-path.ts) - matching that here keeps the route on /lookup/mow
            // across the click below, the same as production, so the active-child assertions hold.
            getEntryPath={() => "/lookup/mow"}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    // Child links legitimately exist elsewhere now (the sidebar's own flyout) - scope this
    // assertion to the header, the thing this change flattened.
    const header = document.querySelector("header")!
    expect(
      within(header).queryByRole("link", { name: "unitLookup.tabs.mow" })
    ).not.toBeInTheDocument()

    // The flyout's content only mounts once open - the row's own click handler opens it
    // immediately (alongside navigating), so use that instead of simulating a hover delay.
    fireEvent.click(screen.getByTestId("desktop-nav-lookup"))

    const flyout = screen.getByTestId("desktop-nav-flyout-lookup")
    expect(
      within(flyout).getByRole("link", { name: /unitLookup\.tabs\.mow/ })
    ).toHaveAttribute("aria-current", "page")
    expect(
      within(flyout).getByRole("link", { name: /unitLookup\.tabs\.character/ })
    ).not.toHaveAttribute("aria-current")
    expect(
      within(flyout).getByRole("link", { name: /unitLookup\.tabs\.npc/ })
    ).toBeInTheDocument()
  })

  it("still navigates a section's own sidebar row via its entry path when the row also has a flyout", () => {
    render(
      <MemoryRouter initialEntries={["/lookup/mow"]}>
        <TooltipProvider>
          <DesktopShell
            isAuthenticated
            visibleItems={navItems as NavItem[]}
            activeSection={lookupItem}
            pageDescription="Lookup description"
            sectionTitle="Lookup"
            onCreateGoal={vi.fn()}
            getEntryPath={() => "/lookup/npc"}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    // Clicking the section's own row uses whatever `getEntryPath` resolves - not a child clicked
    // inside its flyout - confirming the flyout is additive rather than a replacement for it.
    expect(screen.getByTestId("desktop-nav-lookup")).toHaveAttribute(
      "href",
      "/lookup/npc"
    )
  })

  it("still finds and searches the full hierarchy via navigation search", () => {
    render(
      <MemoryRouter initialEntries={["/lookup/mow"]}>
        <TooltipProvider>
          <DesktopShell
            isAuthenticated
            visibleItems={navItems as NavItem[]}
            activeSection={lookupItem}
            pageDescription="Lookup description"
            sectionTitle="Lookup"
            onCreateGoal={vi.fn()}
            getEntryPath={identityEntryPath}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByTestId("desktop-navigation-search"))
    fireEvent.change(screen.getByRole("searchbox", { name: "nav.search" }), {
      target: { value: "unitLookup.tabs.mow" },
    })

    expect(
      screen.getByRole("link", { name: /^nav\.lookup/ })
    ).toBeInTheDocument()
    const mowResult = screen.getByRole("link", {
      name: /^unitLookup\.tabs\.mow/,
    })
    expect(mowResult).toHaveAttribute("aria-current", "page")
    expect(mowResult).toHaveAttribute("href", "/lookup/mow")
    expect(
      screen.queryByRole("link", { name: /^unitLookup\.tabs\.character/ })
    ).not.toBeInTheDocument()
  })

  it("shows each result's description beneath its label in navigation search, for top-level and child items", () => {
    render(
      <MemoryRouter initialEntries={["/lookup/mow"]}>
        <TooltipProvider>
          <DesktopShell
            isAuthenticated
            visibleItems={navItems as NavItem[]}
            activeSection={lookupItem}
            pageDescription="Lookup description"
            sectionTitle="Lookup"
            onCreateGoal={vi.fn()}
            getEntryPath={identityEntryPath}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByTestId("desktop-navigation-search"))
    const dialog = screen.getByTestId("desktop-navigation-dialog")

    expect(
      within(dialog).getByText("nav.lookupDescription")
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText("unitLookup.tabs.mowDescription")
    ).toBeInTheDocument()
  })

  it("finds an item by a query that only matches its description", () => {
    render(
      <MemoryRouter initialEntries={["/lookup/mow"]}>
        <TooltipProvider>
          <DesktopShell
            isAuthenticated
            visibleItems={navItems as NavItem[]}
            activeSection={lookupItem}
            pageDescription="Lookup description"
            sectionTitle="Lookup"
            onCreateGoal={vi.fn()}
            getEntryPath={identityEntryPath}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByTestId("desktop-navigation-search"))
    fireEvent.change(screen.getByRole("searchbox", { name: "nav.search" }), {
      target: { value: "unitLookup.tabs.npcDescription" },
    })

    expect(
      screen.getByRole("link", { name: /^unitLookup\.tabs\.npc/ })
    ).toBeInTheDocument()
  })

  it("toggles navigation search with Ctrl/Cmd+K regardless of focus, and shows the shortcut hint", () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
            isAuthenticated
            visibleItems={navItems as NavItem[]}
            activeSection={homeItem}
            pageDescription="Home description"
            sectionTitle="Home"
            onCreateGoal={vi.fn()}
            getEntryPath={identityEntryPath}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    expect(screen.getByTestId("desktop-navigation-search")).toHaveTextContent(
      "Ctrl+K"
    )
    expect(
      screen.queryByTestId("desktop-navigation-dialog")
    ).not.toBeInTheDocument()

    // Focus is on the document body, not any particular control, when the shortcut fires.
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    expect(screen.getByTestId("desktop-navigation-dialog")).toBeVisible()

    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    expect(
      screen.queryByTestId("desktop-navigation-dialog")
    ).not.toBeInTheDocument()
  })

  it("triggers Create Goal with Ctrl/Cmd+G and shows the shortcut hint", () => {
    const onCreateGoal = vi.fn()
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
            isAuthenticated
            visibleItems={navItems as NavItem[]}
            activeSection={homeItem}
            pageDescription="Home description"
            sectionTitle="Home"
            onCreateGoal={onCreateGoal}
            getEntryPath={identityEntryPath}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    expect(screen.getByTestId("desktop-create-goal-button")).toHaveTextContent(
      "Ctrl+G"
    )

    fireEvent.keyDown(window, { key: "g", ctrlKey: true })

    expect(onCreateGoal).toHaveBeenCalledTimes(1)
  })

  it("navigates a multi-child section to its default child on first visit this session", () => {
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <TooltipProvider>
          <EntryPathHarness />
        </TooltipProvider>
      </MemoryRouter>
    )

    expect(screen.getByTestId("desktop-nav-lookup")).toHaveAttribute(
      "href",
      "/lookup"
    )
  })

  it("navigates a multi-child section to its last-visited child after visiting one", () => {
    render(
      <MemoryRouter initialEntries={["/lookup/mow"]}>
        <TooltipProvider>
          <EntryPathHarness />
        </TooltipProvider>
      </MemoryRouter>
    )

    // Switch to a different top-level section - Lookup's sidebar link should now remember /mow.
    fireEvent.click(screen.getByTestId("desktop-nav-progress"))

    expect(screen.getByTestId("desktop-nav-lookup")).toHaveAttribute(
      "href",
      "/lookup/mow"
    )
  })

  it("treats Dailies as a multi-child section too, once it has children", () => {
    render(
      <MemoryRouter initialEntries={["/dailies/shops"]}>
        <TooltipProvider>
          <EntryPathHarness />
        </TooltipProvider>
      </MemoryRouter>
    )

    // Switch to a different top-level section - Dailies' sidebar link should now remember /shops.
    fireEvent.click(screen.getByTestId("desktop-nav-home"))

    expect(screen.getByTestId("desktop-nav-dailies")).toHaveAttribute(
      "href",
      "/dailies/shops"
    )
  })

  it("keeps single-child and no-children sections on their existing default route", () => {
    render(
      <MemoryRouter initialEntries={["/guild/members"]}>
        <TooltipProvider>
          <EntryPathHarness />
        </TooltipProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByTestId("desktop-nav-home"))

    expect(screen.getByTestId("desktop-nav-guild")).toHaveAttribute(
      "href",
      "/guild"
    )
  })
})
