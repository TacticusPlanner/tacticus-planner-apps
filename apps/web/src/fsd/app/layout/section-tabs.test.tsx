import type { ReactNode } from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Routes, useLocation, useNavigate } from "react-router"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Mirrors desktop-layout.test.tsx's reasoning: nav-items.ts reads `isUiKitEnabled` from the real
// `@/shared/config` module, which also calls `initReactI18next` at import time.
vi.mock("@/shared/config", () => ({ isUiKitEnabled: true }))

import { navItems, type NavItem } from "./nav-items"
import { SectionTabs } from "./section-tabs"

/** Reports the current pathname, and offers a Back control so a test can tell one pushed history
 * entry from none: seed `previousEntry`, press Back, and read where it lands. */
function LocationProbe() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <span data-testid="current-path">{pathname}</span>
      <button
        data-testid="go-back"
        onClick={() => void navigate(-1)}
        type="button"
      >
        back
      </button>
    </>
  )
}

function renderTabs(
  item: (typeof navItems)[number],
  initialEntry: string,
  options: { previousEntry?: string; routes?: ReactNode } = {}
) {
  const entries = options.previousEntry
    ? [options.previousEntry, initialEntry]
    : [initialEntry]
  return render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <SectionTabs item={item} />
      <LocationProbe />
      {options.routes ? <Routes>{options.routes}</Routes> : null}
    </MemoryRouter>
  )
}

const section = (path: string) => navItems.find((item) => item.path === path)!

/** Exact-match, deliberately: `toHaveTextContent` is a substring check, so asserting
 * "/library/raid-bosses" would also pass while still sitting on "/library/raid-bosses/b1". */
function expectPath(pathname: string) {
  expect(screen.getByTestId("current-path")).toHaveTextContent(
    new RegExp(`^${pathname}$`)
  )
}

describe("navItems landing pages", () => {
  it("declares exactly the child pages that have a nested route and render a screen of their own", () => {
    const flagged = navItems.flatMap(
      (item) =>
        item.children
          ?.filter((child) => child.isLandingPage)
          .map((child) => child.path) ?? []
    )

    expect(flagged).toEqual(["/library/raid-bosses", "/legendary-events"])
  })
})

describe("SectionTabs", () => {
  it("renders nothing for a section with no children", () => {
    const { container } = renderTabs(section("/home"), "/home")

    expect(container.querySelector('[data-testid="section-tabs"]')).toBeNull()
  })

  it("lists every child page and marks the active one", () => {
    renderTabs(section("/library"), "/library/machines-of-war")

    expect(screen.getByTestId("section-tab-library-characters")).toBeVisible()
    expect(
      screen.getByTestId("section-tab-library-machines-of-war")
    ).toHaveAttribute("data-state", "active")
    expect(screen.getByTestId("section-tab-library-npcs")).toHaveAttribute(
      "data-state",
      "inactive"
    )
  })

  it("navigates to a child's route when its tab is clicked", async () => {
    const user = userEvent.setup()
    renderTabs(section("/library"), "/library/characters")

    await user.click(screen.getByTestId("section-tab-library-npcs"))

    expectPath("/library/npcs")
  })

  it("still renders a single-tab row for a single-child section", () => {
    renderTabs(section("/guild"), "/guild/members")

    expect(screen.getByTestId("section-tab-guild-members")).toHaveAttribute(
      "data-state",
      "active"
    )
  })

  it("shows the four Dailies tabs in order: Raids, HSE, Shops, Guild Raids", () => {
    renderTabs(section("/dailies"), "/dailies/raids")

    expect(
      screen.getAllByRole("tab").map((tab) => tab.getAttribute("data-testid"))
    ).toEqual([
      "section-tab-dailies-raids",
      "section-tab-dailies-hse",
      "section-tab-dailies-shops",
      "section-tab-dailies-guild-raids",
    ])
    expect(screen.getByTestId("section-tab-dailies-raids")).toHaveAttribute(
      "data-state",
      "active"
    )
  })

  it.each([
    ["raids", "/dailies/raids"],
    ["hse", "/dailies/hse"],
    ["shops", "/dailies/shops"],
    ["guild-raids", "/dailies/guild-raids"],
  ])("deep-links to and highlights the Dailies %s tab", (tab, path) => {
    renderTabs(section("/dailies"), path)

    expect(screen.getByTestId(`section-tab-dailies-${tab}`)).toHaveAttribute(
      "data-state",
      "active"
    )
  })

  it("returns to the raid-boss picker when the Raid Bosses tab is activated from a boss", async () => {
    const user = userEvent.setup()
    renderTabs(section("/library"), "/library/raid-bosses/b1")

    await user.click(screen.getByTestId("section-tab-library-raid-bosses"))

    expectPath("/library/raid-bosses")
  })

  it("returns to the Legendary Events hub when All events is activated from an archived event page", async () => {
    const user = userEvent.setup()
    renderTabs(section("/legendary-events"), "/legendary-events/astarLysander")

    const tab = screen.getByTestId("section-tab-legendary-events")
    expect(tab).toHaveAttribute("data-state", "active")
    await user.click(tab)

    expectPath("/legendary-events")
  })

  it("lists All events then the events with their portraits and marks the open one", () => {
    const item: NavItem = {
      ...section("/legendary-events"),
      children: [
        ...(section("/legendary-events").children ?? []),
        {
          path: "/legendary-events/votanUthar",
          label: "Uthar the Destined",
          description: "Active Legendary Event",
          iconSrc: "/uthar.png",
        },
      ],
    }
    renderTabs(item, "/legendary-events/votanUthar")

    const tabs = screen.getAllByRole("tab")
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "legendaryEvents.tabs.allEvents",
      "Uthar the Destined",
    ])
    const uthar = screen.getByTestId("section-tab-legendary-events-votanUthar")
    expect(uthar).toHaveAttribute("data-state", "active")
    expect(uthar.querySelector("img")).toHaveAttribute("src", "/uthar.png")
    expect(screen.getByTestId("section-tab-legendary-events")).toHaveAttribute(
      "data-state",
      "inactive"
    )
  })

  it("keeps the parent tab active on a route nested below it", () => {
    renderTabs(section("/library"), "/library/raid-bosses/b1")

    expect(
      screen.getByTestId("section-tab-library-raid-bosses")
    ).toHaveAttribute("data-state", "active")
  })

  it("navigates exactly once when a different tab is activated", async () => {
    const user = userEvent.setup()
    renderTabs(section("/library"), "/library/raid-bosses/b1")

    await user.click(screen.getByTestId("section-tab-library-npcs"))
    expectPath("/library/npcs")

    await user.click(screen.getByTestId("go-back"))
    expectPath("/library/raid-bosses/b1")
  })

  it("navigates exactly once when a landing-page tab is activated from a sibling tab", async () => {
    // The double-navigation this change most risks: `onValueChange` fires on mousedown and the
    // click handler runs after, so a missing guard would push /library/raid-bosses twice.
    const user = userEvent.setup()
    renderTabs(section("/library"), "/library/npcs")

    await user.click(screen.getByTestId("section-tab-library-raid-bosses"))
    expectPath("/library/raid-bosses")

    await user.click(screen.getByTestId("go-back"))
    expectPath("/library/npcs")
  })

  it("pushes one history entry when Radix reports the same activation twice", async () => {
    // `userEvent.click` does not reproduce this: in jsdom the state update lands between mousedown
    // and focus, so Radix sees the tab as already selected and reports once. In a real browser
    // react-router's transition is still in flight at focus time and it reports twice. Dispatching
    // both events inside one `act` reproduces that timing - without the guard, two entries are
    // pushed and Back leaves the user on the page they just navigated to.
    const user = userEvent.setup()
    renderTabs(section("/plan"), "/plan/goals")
    const insights = screen.getByTestId("section-tab-plan-insights")

    act(() => {
      fireEvent.mouseDown(insights, { button: 0 })
      fireEvent.focus(insights)
    })
    expectPath("/plan/insights")

    await user.click(screen.getByTestId("go-back"))
    expectPath("/plan/goals")
  })

  it("does nothing when the tab of the exact current page is activated", async () => {
    const user = userEvent.setup()
    renderTabs(section("/plan"), "/plan/projects", {
      previousEntry: "/home",
    })

    await user.click(screen.getByTestId("section-tab-plan-projects"))
    expectPath("/plan/projects")

    await user.click(screen.getByTestId("go-back"))
    expectPath("/home")
  })

  it("navigates on keyboard activation, which Radix reports through onValueChange", async () => {
    const user = userEvent.setup()
    renderTabs(section("/library"), "/library/characters")

    screen.getByTestId("section-tab-library-characters").focus()
    await user.keyboard("{ArrowRight}")

    // Radix's roving focus moves focus (and so activates the tab) inside a `setTimeout(0)`, which
    // `user.keyboard` does not await - asserting straight away races that timer under CPU load.
    await waitFor(() => expectPath("/library/machines-of-war"))
  })

  it.each([
    ["characters", "/library/characters/c1"],
    ["machines-of-war", "/library/machines-of-war/m1"],
    ["npcs", "/library/npcs/n1"],
  ])(
    "leaves a Library %s detail route alone, since its collection path canonicalizes away",
    async (tab, path) => {
      const user = userEvent.setup()
      renderTabs(section("/library"), path, { previousEntry: "/home" })

      await user.click(screen.getByTestId(`section-tab-library-${tab}`))
      expectPath(path)

      await user.click(screen.getByTestId("go-back"))
      expectPath("/home")
    }
  )
})
