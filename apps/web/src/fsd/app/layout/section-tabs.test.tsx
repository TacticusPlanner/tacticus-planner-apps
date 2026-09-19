import type { ReactNode } from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  MemoryRouter,
  Navigate,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Mirrors desktop-layout.test.tsx's reasoning: nav-items.ts reads `isUiKitEnabled` from the real
// `@/shared/config` module, which also calls `initReactI18next` at import time.
vi.mock("@/shared/config", () => ({ isUiKitEnabled: true }))

import { navItems } from "./nav-items"
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

/** A stand-in for the real Dailies routes: mounting those drags in lazy page modules and
 * `ProtectedRoute`, and all this needs to reproduce is the shape - an index that redirects, so a
 * navigation to `/dailies/raids` lands back on `today` and leaves the pathname looking untouched. */
const raidsRedirectRoutes = (
  <>
    <Route path="/dailies/raids">
      <Route index element={<Navigate replace to="/dailies/raids/today" />} />
      <Route path="today" element={null} />
      <Route path="plan" element={null} />
    </Route>
    <Route path="*" element={null} />
  </>
)

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
 * "/goals/projects" would also pass while still sitting on "/goals/projects/p1". */
function expectPath(pathname: string) {
  expect(screen.getByTestId("current-path")).toHaveTextContent(
    new RegExp(`^${pathname}$`)
  )
}

describe("navItems landing pages", () => {
  it("declares exactly the two child pages that render a screen of their own", () => {
    const flagged = navItems.flatMap(
      (item) =>
        item.children
          ?.filter((child) => child.isLandingPage)
          .map((child) => child.path) ?? []
    )

    expect(flagged).toEqual(["/library/raid-bosses", "/goals/projects"])
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

  it.each([
    ["raids", "/dailies/raids/today"],
    ["shops", "/dailies/shops"],
    ["onslaught", "/dailies/onslaught"],
    ["salvage-run", "/dailies/salvage-run"],
    ["arena", "/dailies/arena"],
    ["guild-raids", "/dailies/guild-raids"],
  ])("deep-links to and highlights the Dailies %s tab", (tab, path) => {
    renderTabs(section("/dailies"), path)

    expect(screen.getByTestId(`section-tab-dailies-${tab}`)).toHaveAttribute(
      "data-state",
      "active"
    )
  })

  it("reports the post-redirect pathname when a mounted route tree redirects", () => {
    renderTabs(section("/dailies"), "/dailies/raids", {
      routes: raidsRedirectRoutes,
    })

    expectPath("/dailies/raids/today")
  })

  it("returns to the all-projects screen when the Projects tab is activated from a project", async () => {
    const user = userEvent.setup()
    renderTabs(section("/goals"), "/goals/projects/p1")

    await user.click(screen.getByTestId("section-tab-goals-projects"))

    expectPath("/goals/projects")
  })

  it("returns to the raid-boss picker when the Raid Bosses tab is activated from a boss", async () => {
    const user = userEvent.setup()
    renderTabs(section("/library"), "/library/raid-bosses/b1")

    await user.click(screen.getByTestId("section-tab-library-raid-bosses"))

    expectPath("/library/raid-bosses")
  })

  it("keeps the parent tab active on a route nested below it", () => {
    renderTabs(section("/goals"), "/goals/projects/p1")

    expect(screen.getByTestId("section-tab-goals-projects")).toHaveAttribute(
      "data-state",
      "active"
    )
  })

  it("navigates exactly once when a different tab is activated", async () => {
    const user = userEvent.setup()
    renderTabs(section("/goals"), "/goals/projects/p1")

    await user.click(screen.getByTestId("section-tab-goals-insights"))
    expectPath("/goals/insights")

    await user.click(screen.getByTestId("go-back"))
    expectPath("/goals/projects/p1")
  })

  it("navigates exactly once when a landing-page tab is activated from a sibling tab", async () => {
    // The double-navigation this change most risks: `onValueChange` fires on mousedown and the
    // click handler runs after, so a missing guard would push /goals/projects twice.
    const user = userEvent.setup()
    renderTabs(section("/goals"), "/goals/overview")

    await user.click(screen.getByTestId("section-tab-goals-projects"))
    expectPath("/goals/projects")

    await user.click(screen.getByTestId("go-back"))
    expectPath("/goals/overview")
  })

  it("pushes one history entry when Radix reports the same activation twice", async () => {
    // `userEvent.click` does not reproduce this: in jsdom the state update lands between mousedown
    // and focus, so Radix sees the tab as already selected and reports once. In a real browser
    // react-router's transition is still in flight at focus time and it reports twice. Dispatching
    // both events inside one `act` reproduces that timing - without the guard, two entries are
    // pushed and Back leaves the user on the page they just navigated to.
    const user = userEvent.setup()
    renderTabs(section("/goals"), "/goals/overview")
    const insights = screen.getByTestId("section-tab-goals-insights")

    act(() => {
      fireEvent.mouseDown(insights, { button: 0 })
      fireEvent.focus(insights)
    })
    expectPath("/goals/insights")

    await user.click(screen.getByTestId("go-back"))
    expectPath("/goals/overview")
  })

  it("does nothing when the tab of the exact current page is activated", async () => {
    const user = userEvent.setup()
    renderTabs(section("/goals"), "/goals/projects", {
      previousEntry: "/home",
    })

    await user.click(screen.getByTestId("section-tab-goals-projects"))
    expectPath("/goals/projects")

    await user.click(screen.getByTestId("go-back"))
    expectPath("/home")
  })

  it("navigates on keyboard activation, which Radix reports through onValueChange", async () => {
    const user = userEvent.setup()
    renderTabs(section("/library"), "/library/characters")

    screen.getByTestId("section-tab-library-characters").focus()
    await user.keyboard("{ArrowRight}")

    expectPath("/library/machines-of-war")
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

  it.each(["/dailies/raids/today", "/dailies/raids/plan"])(
    "leaves %s alone, pushing no entry the Back button would swallow",
    async (path) => {
      // The pathname alone cannot catch a regression here: navigating to `/dailies/raids` would
      // redirect straight back to `today`. The Back press is what proves nothing was pushed.
      const user = userEvent.setup()
      renderTabs(section("/dailies"), path, {
        previousEntry: "/home",
        routes: raidsRedirectRoutes,
      })

      await user.click(screen.getByTestId("section-tab-dailies-raids"))
      expectPath(path)

      await user.click(screen.getByTestId("go-back"))
      expectPath("/home")
    }
  )
})
