import { fireEvent, render, screen, within } from "@testing-library/react"
import { useState, type ComponentProps } from "react"
import { Link, MemoryRouter, useLocation } from "react-router"
import { describe, expect, it, vi } from "vitest"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { section?: string }) =>
      options?.section ? `${key} ${options.section}` : key,
  }),
}))

// `./nav-items` reads `isUiKitEnabled` from the real module's barrel, which also re-exports the
// i18n setup calls `initReactI18next` at import time, which is incompatible with the plain
// `useTranslation` mock above. `true` matches the non-production default so `navItems` keeps its
// UI Kit entry.
vi.mock("@/shared/config", () => ({ isUiKitEnabled: true }))

vi.mock("../providers/player-data-sync-button", () => ({
  PlayerDataSyncButton: () => null,
}))
vi.mock("../providers/auth-control", () => ({
  AuthControl: () => <div data-testid="auth-account" />,
}))
vi.mock("../providers/userjot-board-link", () => ({
  UserJotBoardLink: () => <a data-testid="userjot-board-link" />,
}))
vi.mock("../providers/userjot-feedback-button", () => ({
  UserJotFeedbackButton: () => <button data-testid="userjot-feedback-button" />,
}))
vi.mock("@/shared/tour", () => ({
  TourButton: () => <button data-testid="tour-button" />,
  PageTourButton: () => null,
}))

import { DesktopShell as ControlledDesktopShell } from "./desktop-layout"
import type { NavItem } from "./nav-items"
import { navItems } from "./nav-items"
import type { QuickAction } from "./quick-actions"
import { resolveActiveNavigation } from "./resolve-active-navigation"
import { useSectionEntryPath } from "./use-section-entry-path"

const noQuickActions = { actions: [], select: () => false, flush: () => {} }

function identityEntryPath(item: NavItem) {
  return item.path
}

// Holds the menu state the way `ShellContent` does, so tests exercise the controlled shell.
function DesktopShell(
  props: Omit<
    ComponentProps<typeof ControlledDesktopShell>,
    | "primaryExpanded"
    | "onPrimaryExpandedChange"
    | "sectionExpanded"
    | "onSectionExpandedChange"
    | "quickActions"
  > &
    Partial<Pick<ComponentProps<typeof ControlledDesktopShell>, "quickActions">>
) {
  const [primaryExpanded, setPrimaryExpanded] = useState(false)
  const [sectionExpanded, setSectionExpanded] = useState(true)

  return (
    <ControlledDesktopShell
      quickActions={noQuickActions}
      {...props}
      onPrimaryExpandedChange={setPrimaryExpanded}
      onSectionExpandedChange={setSectionExpanded}
      primaryExpanded={primaryExpanded}
      sectionExpanded={sectionExpanded}
    />
  )
}

const homeItem = navItems.find((item) => item.path === "/home")!
const lookupItem = navItems.find((item) => item.path === "/library")!

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
    // mode), so it stays reachable while collapsed: only one trigger is needed, and it lives in
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

  it("has no board link or other controls in the page header; feedback sits in the global bar", () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
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

    expect(screen.queryByTestId("userjot-board-link")).toBeNull()
    expect(screen.queryByTestId("desktop-header-controls")).toBeNull()
    const bar = screen.getByTestId("desktop-top-bar")
    expect(
      within(bar).getByTestId("userjot-feedback-button")
    ).toBeInTheDocument()
    expect(screen.getAllByTestId("userjot-feedback-button")).toHaveLength(1)
  })

  it("puts the rail toggle first and the tour button second at the top of the rail, above Create Goal", () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
            visibleItems={navItems as NavItem[]}
            activeSection={homeItem}
            pageDescription="Home"
            sectionTitle="Home"
            onCreateGoal={vi.fn()}
            getEntryPath={identityEntryPath}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    const tools = screen.getByTestId("desktop-sidebar-tools")
    // Stacked rows: the toggle never shares a row with the tour button.
    expect(tools).toHaveClass("flex-col")
    // The toggle is a full-width row whose state is announced and whose icon flips.
    const toggle = tools.firstElementChild as HTMLElement
    expect(toggle).toHaveClass("w-full")
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("aria-expanded", "true")
    expect(tools.firstElementChild).toHaveAttribute(
      "data-slot",
      "sidebar-trigger"
    )
    expect(tools.firstElementChild?.nextElementSibling).toHaveAttribute(
      "data-testid",
      "tour-button"
    )
    const create = screen.getByTestId("desktop-create-goal-button")
    expect(
      tools.compareDocumentPosition(create) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(screen.queryByTestId("desktop-sidebar-footer")).toBeNull()
  })

  it("shows just the child title (no breadcrumb) while the section menu is expanded", () => {
    render(
      <MemoryRouter initialEntries={["/library/machines-of-war"]}>
        <TooltipProvider>
          <DesktopShell
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
    expect(title).toHaveTextContent("library:collections.machinesOfWar.label")
    expect(title).not.toHaveTextContent("Lookup")
    expect(screen.queryByTestId("section-header-breadcrumb")).toBeNull()
    // The panel header names the section.
    expect(
      within(screen.getByTestId("desktop-section-navigation")).getByText(
        "library:section.label"
      )
    ).toBeInTheDocument()
    expect(screen.getByText("Machines of War description")).toBeInTheDocument()
  })

  it("shows the 'Section >' breadcrumb and reopen button in the page header while the menu is collapsed", () => {
    render(
      <MemoryRouter initialEntries={["/library/machines-of-war"]}>
        <TooltipProvider>
          <DesktopShell
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

    fireEvent.click(screen.getByTestId("desktop-section-toggle"))

    const breadcrumb = screen.getByTestId("section-header-breadcrumb")
    expect(breadcrumb).toHaveTextContent("Lookup")
    expect(breadcrumb).toHaveTextContent("\u203a")
    expect(screen.getByTestId("section-header-title")).toHaveTextContent(
      "library:collections.machinesOfWar.label"
    )
    // The whole panel column is released - no floating reopen control is left behind.
    expect(screen.queryByTestId("desktop-section-navigation")).toBeNull()
    expect(
      within(screen.getByRole("banner")).getByTestId("desktop-section-toggle")
    ).toHaveAttribute("aria-expanded", "false")
  })

  it("lists the Plan section children as text-only rows with no count badge", () => {
    const planItem = navItems.find((item) => item.path === "/plan")!
    render(
      <MemoryRouter initialEntries={["/plan/goals"]}>
        <TooltipProvider>
          <DesktopShell
            visibleItems={navItems as NavItem[]}
            activeSection={planItem}
            pageDescription="Plan"
            sectionTitle="Plan"
            onCreateGoal={vi.fn()}
            getEntryPath={identityEntryPath}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    const menu = screen.getByTestId("desktop-section-navigation")
    const links = within(menu).getAllByRole("link")
    expect(links).toHaveLength(4)
    links.forEach((link) => expect(link.querySelector("svg")).toBeNull())
    expect(within(menu).queryByTestId("section-goals-count")).toBeNull()
    // The panel is a sibling column of the page header's column, not nested under the header.
    const header = screen.getByRole("banner")
    expect(menu.contains(header)).toBe(false)
    expect(header.parentElement).toBe(menu.parentElement?.nextElementSibling)
  })

  it("lists every child page in the persistent section menu, not the header", () => {
    render(
      <MemoryRouter initialEntries={["/library/machines-of-war"]}>
        <TooltipProvider>
          <DesktopShell
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

    const header = screen.getByTestId("section-header-title")
    expect(
      within(header).queryByRole("link", {
        name: "library:collections.machinesOfWar.label",
      })
    ).not.toBeInTheDocument()

    const menu = screen.getByRole("navigation", {
      name: "nav.sectionNavigation library:section.label",
    })
    expect(
      within(menu).getByRole("link", {
        name: "library:collections.machinesOfWar.label",
      })
    ).toHaveAttribute("aria-current", "page")
    for (const key of ["characters", "npcs", "raidBosses", "shops"]) {
      expect(
        within(menu).getByRole("link", {
          name: `library:collections.${key}.label`,
        })
      ).not.toHaveAttribute("aria-current")
    }
    // The old hover flyout is gone.
    expect(screen.queryByTestId("nav-children-flyout")).not.toBeInTheDocument()
  })

  it("keeps sibling links visible and marks the nested route's collection active", () => {
    render(
      <MemoryRouter initialEntries={["/library/characters/some-character"]}>
        <TooltipProvider>
          <DesktopShell
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

    const menu = screen.getByTestId("desktop-section-navigation")
    expect(
      within(menu).getByRole("link", {
        name: "library:collections.characters.label",
      })
    ).toHaveAttribute("aria-current", "page")
    expect(within(menu).getAllByRole("link")).toHaveLength(5)
    expect(screen.getByTestId("desktop-nav-library")).toHaveAttribute(
      "data-active",
      "true"
    )
  })

  it("shows a single-child section's menu (Guild) and no column for childless Home", () => {
    const guildItem = navItems.find((item) => item.path === "/guild")!
    const { rerender } = render(
      <MemoryRouter initialEntries={["/guild/members"]}>
        <TooltipProvider>
          <DesktopShell
            visibleItems={navItems as NavItem[]}
            activeSection={guildItem}
            pageDescription="Guild"
            sectionTitle="Guild"
            onCreateGoal={vi.fn()}
            getEntryPath={identityEntryPath}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    expect(
      within(screen.getByTestId("desktop-section-navigation")).getAllByRole(
        "link"
      )
    ).toHaveLength(1)

    rerender(
      <MemoryRouter initialEntries={["/guild/members"]}>
        <TooltipProvider>
          <DesktopShell
            visibleItems={navItems as NavItem[]}
            activeSection={homeItem}
            pageDescription="Home"
            sectionTitle="Home"
            onCreateGoal={vi.fn()}
            getEntryPath={identityEntryPath}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    expect(
      screen.queryByTestId("desktop-section-navigation")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("desktop-section-toggle")
    ).not.toBeInTheDocument()
  })

  it("collapses the section menu, hands focus to the header reopen control, and restores it", () => {
    render(
      <MemoryRouter initialEntries={["/library/characters"]}>
        <TooltipProvider>
          <DesktopShell
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

    const collapse = screen.getByTestId("desktop-section-toggle")
    // The shortcut hint is visible (not just a title) and hidden from assistive tech.
    const hint = within(collapse).getByTestId("section-shortcut-hint")
    expect(hint).toHaveTextContent(/^(Ctrl\+B|⌘B)$/)
    expect(hint).toHaveAttribute("aria-hidden", "true")
    expect(collapse).toHaveAttribute("aria-keyshortcuts")
    expect(collapse).toHaveAttribute("aria-expanded", "true")
    expect(collapse).toHaveAttribute("aria-controls")
    collapse.focus()

    fireEvent.click(collapse)

    // Links leave the DOM (and tab order) with the column; the reopen button takes focus.
    expect(screen.queryByTestId("desktop-section-navigation")).toBeNull()
    // The column stays mounted to animate its width, but is inert, hidden, and reduced-motion safe.
    const column = screen.getByTestId("desktop-section-column")
    expect(column).toHaveAttribute("inert")
    expect(column).toHaveAttribute("aria-hidden", "true")
    expect(column).toHaveClass(
      "invisible",
      "w-0",
      "motion-reduce:transition-none"
    )
    const reopen = screen.getByTestId("desktop-section-toggle")
    // No visible hint in the collapsed view (title and aria-keyshortcuts only).
    expect(within(reopen).queryByTestId("section-shortcut-hint")).toBeNull()
    expect(reopen).toHaveAttribute("aria-keyshortcuts")
    // The main rail toggle has no shortcut hint.
    expect(
      screen
        .getByRole("button", { name: "Toggle Sidebar" })
        .querySelector('[data-testid="section-shortcut-hint"]')
    ).toBeNull()
    expect(reopen).toHaveAttribute("aria-expanded", "false")
    expect(reopen).toHaveFocus()

    fireEvent.click(reopen)

    const menu = screen.getByTestId("desktop-section-navigation")
    expect(within(menu).getAllByRole("link")).toHaveLength(5)
    expect(screen.getByTestId("desktop-section-toggle")).toHaveAttribute(
      "aria-expanded",
      "true"
    )
    expect(screen.getByTestId("desktop-section-toggle")).toHaveFocus()
    expect(screen.getByTestId("desktop-section-column")).not.toHaveAttribute(
      "inert"
    )
  })

  it("Ctrl+B toggles the section menu, never the main rail, even from a focused input", () => {
    render(
      <MemoryRouter initialEntries={["/library/characters"]}>
        <TooltipProvider>
          <input data-testid="outside-input" />
          <DesktopShell
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
    const rail = () => document.querySelector('[data-slot="sidebar"]')
    const input = screen.getByTestId("outside-input")
    input.focus()

    expect(fireEvent.keyDown(input, { ctrlKey: true, key: "b" })).toBe(false)
    expect(screen.queryByTestId("desktop-section-navigation")).toBeNull()
    expect(rail()).toHaveAttribute("data-state", "collapsed")
    // Focus was outside the panel, so it is left where it was.
    expect(input).toHaveFocus()

    fireEvent.keyDown(input, { metaKey: true, key: "b" })
    expect(screen.getByTestId("desktop-section-navigation")).toBeInTheDocument()
    expect(rail()).toHaveAttribute("data-state", "collapsed")

    // Key repeat is ignored.
    fireEvent.keyDown(input, { ctrlKey: true, key: "b", repeat: true })
    expect(screen.getByTestId("desktop-section-navigation")).toBeInTheDocument()
  })

  it("Ctrl+B moves focus to the reopen button when it hides the panel holding focus", () => {
    render(
      <MemoryRouter initialEntries={["/library/characters"]}>
        <TooltipProvider>
          <DesktopShell
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
    const link = within(
      screen.getByTestId("desktop-section-navigation")
    ).getAllByRole("link")[0]
    link.focus()

    fireEvent.keyDown(link, { ctrlKey: true, key: "b" })

    expect(screen.getByTestId("desktop-section-toggle")).toHaveFocus()
    expect(
      screen.getByTestId("desktop-section-toggle").getAttribute("title")
    ).toMatch(/(Ctrl\+B|⌘B)\)$/)
  })

  it("Ctrl+B does nothing on a childless page", () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
            visibleItems={navItems as NavItem[]}
            activeSection={homeItem}
            pageDescription="Home"
            sectionTitle="Home"
            onCreateGoal={vi.fn()}
            getEntryPath={identityEntryPath}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    expect(fireEvent.keyDown(window, { ctrlKey: true, key: "b" })).toBe(true)
    expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute(
      "data-state",
      "collapsed"
    )
  })

  it("controls the main rail and the section menu independently", () => {
    render(
      <MemoryRouter initialEntries={["/library/characters"]}>
        <TooltipProvider>
          <DesktopShell
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

    const rail = () => document.querySelector('[data-slot="sidebar"]')
    // Defaults: compact main rail, expanded section menu.
    expect(rail()).toHaveAttribute("data-state", "collapsed")
    expect(screen.getByTestId("desktop-section-toggle")).toHaveAttribute(
      "aria-expanded",
      "true"
    )

    fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }))
    expect(rail()).toHaveAttribute("data-state", "expanded")
    expect(screen.getByTestId("desktop-section-toggle")).toHaveAttribute(
      "aria-expanded",
      "true"
    )

    fireEvent.click(screen.getByTestId("desktop-section-toggle"))
    expect(rail()).toHaveAttribute("data-state", "expanded")
    expect(screen.getByTestId("desktop-section-toggle")).toHaveAttribute(
      "aria-expanded",
      "false"
    )
  })

  it("starts compact even when an old sidebar cookie says expanded", () => {
    document.cookie = "sidebar_state=true; path=/"
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
            visibleItems={navItems as NavItem[]}
            activeSection={homeItem}
            pageDescription="Home"
            sectionTitle="Home"
            onCreateGoal={vi.fn()}
            getEntryPath={identityEntryPath}
          />
        </TooltipProvider>
      </MemoryRouter>
    )
    document.cookie = "sidebar_state=; path=/; max-age=0"

    expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute(
      "data-state",
      "collapsed"
    )
  })

  it("keeps both menu choices through sibling, cross-section, and childless navigation", () => {
    function NavigatingShell() {
      const { pathname } = useLocation()
      const { activeItem } = resolveActiveNavigation(
        navItems as NavItem[],
        pathname
      )

      return (
        <>
          <Link to="/library/npcs">npcs</Link>
          <Link to="/home">home</Link>
          <Link to="/dailies/raids">dailies</Link>
          <DesktopShell
            activeSection={activeItem}
            getEntryPath={identityEntryPath}
            onCreateGoal={vi.fn()}
            pageDescription="d"
            sectionTitle="t"
            visibleItems={navItems as NavItem[]}
          />
        </>
      )
    }

    render(
      <MemoryRouter initialEntries={["/library/characters"]}>
        <TooltipProvider>
          <NavigatingShell />
        </TooltipProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }))
    fireEvent.click(screen.getByTestId("desktop-section-toggle"))

    const railExpanded = () =>
      document
        .querySelector('[data-slot="sidebar"]')
        ?.getAttribute("data-state")
    const sectionExpanded = () =>
      screen
        .queryByTestId("desktop-section-toggle")
        ?.getAttribute("aria-expanded")

    fireEvent.click(screen.getByText("npcs")) // sibling
    expect(railExpanded()).toBe("expanded")
    expect(sectionExpanded()).toBe("false")

    fireEvent.click(screen.getByText("dailies")) // cross-section
    expect(railExpanded()).toBe("expanded")
    expect(sectionExpanded()).toBe("false")

    fireEvent.click(screen.getByText("home")) // childless: no column, choice kept
    expect(railExpanded()).toBe("expanded")
    expect(sectionExpanded()).toBeUndefined()

    fireEvent.click(screen.getByText("dailies"))
    expect(sectionExpanded()).toBe("false")
  })

  it("renders the global bar once, with search and account, and no sidebar duplicates", () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
            visibleItems={navItems as NavItem[]}
            activeSection={homeItem}
            pageDescription="Home"
            sectionTitle="Home"
            onCreateGoal={vi.fn()}
            getEntryPath={identityEntryPath}
          />
        </TooltipProvider>
      </MemoryRouter>
    )

    const bar = screen.getByTestId("desktop-top-bar")
    expect(
      within(bar).getByTestId("desktop-navigation-search")
    ).toBeInTheDocument()
    expect(within(bar).getByTestId("auth-account")).toBeInTheDocument()
    expect(screen.getAllByTestId("desktop-navigation-search")).toHaveLength(1)
    expect(screen.getAllByTestId("auth-account")).toHaveLength(1)
    expect(screen.getAllByTestId("app-header-logo")).toHaveLength(1)

    const sidebar = document.querySelector(
      '[data-slot="sidebar"]'
    ) as HTMLElement
    expect(
      within(sidebar).getByTestId("desktop-create-goal-button")
    ).toBeInTheDocument()
    expect(
      within(sidebar).queryByTestId("desktop-navigation-search")
    ).not.toBeInTheDocument()
  })

  it("still finds and searches the full hierarchy via navigation search", () => {
    render(
      <MemoryRouter initialEntries={["/library/machines-of-war"]}>
        <TooltipProvider>
          <DesktopShell
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
      target: { value: "library:collections.machinesOfWar.label" },
    })

    expect(
      screen.getByRole("link", { name: /^library:section\.label/ })
    ).toBeInTheDocument()
    const mowResult = screen.getByRole("link", {
      name: /^library:collections\.machinesOfWar\.label/,
    })
    expect(mowResult).toHaveAttribute("aria-current", "page")
    expect(mowResult).toHaveAttribute("href", "/library/machines-of-war")
    expect(
      screen.queryByRole("link", {
        name: /^library:collections\.characters\.label/,
      })
    ).not.toBeInTheDocument()
  })

  it("shows each result's description beneath its label in navigation search, for top-level and child items", () => {
    render(
      <MemoryRouter initialEntries={["/library/machines-of-war"]}>
        <TooltipProvider>
          <DesktopShell
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
      within(dialog).getByText("library:section.description")
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText("library:collections.machinesOfWar.description")
    ).toBeInTheDocument()
  })

  it("finds an item by a query that only matches its description", () => {
    render(
      <MemoryRouter initialEntries={["/library/machines-of-war"]}>
        <TooltipProvider>
          <DesktopShell
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
      target: { value: "library:collections.npcs.description" },
    })

    expect(
      screen.getByRole("link", { name: /^library:collections\.npcs\.label/ })
    ).toBeInTheDocument()
  })

  it("toggles navigation search with Ctrl/Cmd+K regardless of focus, and shows the shortcut hint", () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
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

  it("closes navigation search with Ctrl/Cmd+K from its focused input, and Escape returns focus to the launcher", async () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
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

    const launcher = screen.getByTestId("desktop-navigation-search")
    launcher.focus()
    fireEvent.click(launcher)
    const input = screen.getByRole("searchbox", { name: "nav.search" })
    input.focus()

    fireEvent.keyDown(input, { key: "k", ctrlKey: true })
    expect(
      screen.queryByTestId("desktop-navigation-dialog")
    ).not.toBeInTheDocument()

    launcher.focus()
    fireEvent.click(launcher)
    fireEvent.keyDown(screen.getByRole("searchbox", { name: "nav.search" }), {
      key: "Escape",
    })
    expect(
      screen.queryByTestId("desktop-navigation-dialog")
    ).not.toBeInTheDocument()
    await vi.waitFor(() => expect(launcher).toHaveFocus())
  })

  it("triggers Create Goal with Ctrl/Cmd+G and shows the shortcut hint", () => {
    const onCreateGoal = vi.fn()
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
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

    // The rail starts compact, which hides the inline hint.
    fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }))

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

    expect(screen.getByTestId("desktop-nav-library")).toHaveAttribute(
      "href",
      "/library"
    )
  })

  it("navigates a multi-child section to its last-visited child after visiting one", () => {
    render(
      <MemoryRouter initialEntries={["/library/machines-of-war"]}>
        <TooltipProvider>
          <EntryPathHarness />
        </TooltipProvider>
      </MemoryRouter>
    )

    // Switch to a different top-level section - Lookup's sidebar link should now remember /mow.
    fireEvent.click(screen.getByTestId("desktop-nav-progress"))

    expect(screen.getByTestId("desktop-nav-library")).toHaveAttribute(
      "href",
      "/library/machines-of-war"
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

  it("lists Events after Progress and before Guild, entering through the section root", () => {
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <TooltipProvider>
          <EntryPathHarness />
        </TooltipProvider>
      </MemoryRouter>
    )

    const links = Array.from(
      screen
        .getByTestId("primary-nav")
        .querySelectorAll<HTMLAnchorElement>('[data-testid^="desktop-nav-"]')
    ).map((link) => link.dataset.testid)
    expect(links.indexOf("desktop-nav-events")).toBe(
      links.indexOf("desktop-nav-progress") + 1
    )
    expect(links.indexOf("desktop-nav-guild")).toBe(
      links.indexOf("desktop-nav-events") + 1
    )
    // `/events` redirects to its one child, `/events/legendary-events` (see pages/events/route.tsx).
    expect(screen.getByTestId("desktop-nav-events")).toHaveAttribute(
      "href",
      "/events"
    )
  })

  it("finds Legendary Events by 'legendary' in navigation search", () => {
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <TooltipProvider>
          <DesktopShell
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

    fireEvent.click(screen.getByTestId("desktop-navigation-search"))
    fireEvent.change(screen.getByRole("searchbox", { name: "nav.search" }), {
      target: { value: "legendary" },
    })

    const result = screen.getByRole("link", {
      name: /^events\.tabs\.legendaryEvents/,
    })
    expect(result).toHaveAttribute("href", "/events/legendary-events")
    expect(result).toHaveTextContent("events.tabs.legendaryEventsDescription")
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

describe("DesktopShell quick actions in navigation search", () => {
  const actionOf = (
    id: QuickAction["id"],
    label: string,
    extra: Partial<QuickAction> = {}
  ): QuickAction => ({
    id,
    icon: (() => null) as unknown as QuickAction["icon"],
    label,
    description: `${label} description`,
    keywords: [],
    ...extra,
  })

  function renderWithActions(actions: QuickAction[]) {
    const quickActions = {
      actions,
      select: vi.fn((id: QuickAction["id"]) => {
        const found = actions.find((action) => action.id === id)
        return !!found && !found.disabledReason
      }),
      flush: vi.fn(),
    }
    render(
      <MemoryRouter>
        <TooltipProvider>
          <DesktopShell
            activeSection={homeItem}
            getEntryPath={identityEntryPath}
            onCreateGoal={vi.fn()}
            pageDescription="Home description"
            quickActions={quickActions}
            sectionTitle="Home"
            visibleItems={navItems as NavItem[]}
          />
        </TooltipProvider>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByTestId("desktop-navigation-search"))
    return quickActions
  }

  it("lists Quick actions as buttons before the Pages links", () => {
    renderWithActions([actionOf("createGoal", "Create Goal")])
    const dialog = within(screen.getByTestId("desktop-navigation-dialog"))

    const headings = dialog.getAllByRole("heading", { level: 3 })
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "nav.quickActions.heading",
      "nav.quickActions.pagesHeading",
    ])
    expect(dialog.getByRole("button", { name: /Create Goal/ })).toBeVisible()
    expect(dialog.getAllByRole("link").length).toBeGreaterThan(0)
  })

  it("selects an action on click, closes search, and dispatches only after the dialog has closed", async () => {
    const quickActions = renderWithActions([
      actionOf("createGoal", "Create Goal"),
    ])

    fireEvent.click(screen.getByRole("button", { name: /Create Goal/ }))

    expect(quickActions.select).toHaveBeenCalledWith("createGoal")
    expect(
      screen.queryByTestId("desktop-navigation-dialog")
    ).not.toBeInTheDocument()
    await vi.waitFor(() => expect(quickActions.flush).toHaveBeenCalledTimes(1))
    await vi.waitFor(() =>
      expect(screen.getByTestId("desktop-navigation-search")).toHaveFocus()
    )
  })

  it("does not run an action when typing or pressing Enter in the search input", () => {
    const quickActions = renderWithActions([actionOf("sync", "Sync", {})])
    const input = screen.getByRole("searchbox", { name: "nav.search" })

    fireEvent.change(input, { target: { value: "sync" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(quickActions.select).not.toHaveBeenCalled()
    expect(screen.getByTestId("desktop-navigation-dialog")).toBeVisible()
  })

  it("keeps a disabled action visible with its explanation and leaves search open on click", () => {
    const quickActions = renderWithActions([
      actionOf("sync", "Sync", { disabledReason: "Syncing 1/2" }),
    ])
    const row = screen.getByRole("button", { name: /Sync/ })

    expect(row).toBeDisabled()
    expect(row).toHaveTextContent("Syncing 1/2")
    fireEvent.click(row)
    expect(quickActions.select).not.toHaveBeenCalled()
    expect(screen.getByTestId("desktop-navigation-dialog")).toBeVisible()
  })

  it("filters actions and pages independently and shows one no-results message only when both are empty", () => {
    renderWithActions([
      actionOf("createProject", "New project", { keywords: ["proj"] }),
    ])
    const input = screen.getByRole("searchbox", { name: "nav.search" })
    const dialog = within(screen.getByTestId("desktop-navigation-dialog"))

    fireEvent.change(input, { target: { value: "new project" } })
    expect(dialog.getByRole("button", { name: /New project/ })).toBeVisible()
    expect(
      dialog.queryByText("nav.quickActions.pagesHeading")
    ).not.toBeInTheDocument()
    expect(dialog.queryByText("nav.noResults")).not.toBeInTheDocument()

    fireEvent.change(input, { target: { value: "zzzz-nothing" } })
    expect(dialog.getByText("nav.noResults")).toBeVisible()
    expect(dialog.queryAllByRole("heading", { level: 3 })).toHaveLength(0)
  })
})
