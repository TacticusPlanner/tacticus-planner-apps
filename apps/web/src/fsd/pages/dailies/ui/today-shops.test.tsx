import { MemoryRouter, Outlet, Route, Routes } from "react-router"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import type { DailiesOutletContext } from "./dailies-layout"
import { TodayShops } from "./today-shops"
import type {
  ShopRecommendationSectionView,
  ShopRecommendationsViewModel,
} from "@/features/shop-recommendations"

const useShopRecommendations = vi.fn<() => ShopRecommendationsViewModel>()
const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}))

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}))
vi.mock(
  "@/features/shop-recommendations/model/use-shop-recommendations",
  () => ({
    useShopRecommendations: () => useShopRecommendations(),
  })
)
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

const retryProjects = vi.fn()
let contextOverrides: Partial<DailiesOutletContext> = {}

function renderPage() {
  const context: DailiesOutletContext = {
    projects: [
      {
        projectId: "p1",
        name: "My Project",
        description: null,
        color: null,
        status: "Active",
        isDefault: false,
        goalIds: [] as string[],
        target: null,
        revision: 1,
        createdAt: "",
        updatedAt: "",
      },
    ],
    projectId: "p1",
    setProjectId: vi.fn(),
    projectsUnavailable: false,
    projectsError: false,
    retryProjects,
    ...contextOverrides,
  }
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Outlet context={context} />}>
          <Route index element={<TodayShops />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

function section(): ShopRecommendationSectionView {
  return {
    shopId: "guild",
    guaranteed: [
      {
        shopId: "guild",
        rewardType: "shards_eldarFarseer",
        unitId: "eldarFarseer",
        rewardQty: 5,
        cost: { currency: "guildCredits", amount: 525 },
        maxPerDay: 2,
        isGuaranteed: true,
        acquired: 30,
        required: 130,
        remaining: 100,
        remainingCost: 10_500,
        neededBy: [{ unitId: "eldarFarseer", unitName: "Farseer", count: 100 }],
        rewardName: "Farseer shards",
        rewardKind: "shard",
      },
    ],
    possible: [
      {
        shopId: "guild",
        rewardType: "upgHpM001",
        rewardQty: 1,
        cost: { currency: "guildCredits", amount: 900 },
        maxPerDay: 2,
        isGuaranteed: false,
        acquired: 0,
        required: 3,
        remaining: 3,
        remainingCost: 2_700,
        neededBy: [{ unitId: "eldarFarseer", unitName: "Farseer", count: 3 }],
        rewardName: "Imperial Aquila",
        rewardKind: "upgrade",
      },
    ],
  }
}

beforeEach(() => {
  contextOverrides = {}
  retryProjects.mockClear()
  useIsMobileMock.mockReturnValue(false)
  useShopRecommendations.mockReturnValue({ status: "loading" })
})

describe("TodayShops", () => {
  it("renders its title as an h2 section of the Raids tab", () => {
    renderPage()
    // The shell header owns the page h1; the section sits beside the raid lanes' h2s.
    expect(screen.queryAllByRole("heading", { level: 1 })).toHaveLength(0)
    expect(
      screen.getByRole("heading", { level: 2, name: "title" })
    ).toBeInTheDocument()
  })

  it("shows the loading state", () => {
    useShopRecommendations.mockReturnValue({ status: "loading" })
    renderPage()
    expect(screen.getByTestId("shops-loading")).toBeInTheDocument()
  })

  it("has no project selector of its own: the Raids selector narrows it", () => {
    useShopRecommendations.mockReturnValue({ status: "loading" })
    renderPage()
    expect(screen.queryByTestId("shops-project-select")).not.toBeInTheDocument()
    expect(
      screen.getByText('subtitle:{"project":"My Project"}')
    ).toBeInTheDocument()
  })

  it("shows the no-Active-goals state when there is nothing to shop for", () => {
    useShopRecommendations.mockReturnValue({ status: "no-goals" })
    renderPage()
    expect(screen.getByTestId("shops-no-goals")).toBeInTheDocument()
  })

  it("describes the offers as for every Active goal until a project is chosen", () => {
    useShopRecommendations.mockReturnValue({ status: "loading" })
    contextOverrides = { projectId: undefined }
    renderPage()
    expect(screen.getByText("subtitleAll")).toBeInTheDocument()
  })

  it("shows the no-project state when no project is available", () => {
    contextOverrides = { projectsUnavailable: true }
    renderPage()
    expect(screen.getByTestId("shops-no-project")).toBeInTheDocument()
  })

  it("does not block the all-goals scope on a failed projects list", () => {
    useShopRecommendations.mockReturnValue({ status: "no-goals" })
    contextOverrides = { projectId: undefined, projectsError: true }
    renderPage()
    expect(screen.getByTestId("shops-no-goals")).toBeInTheDocument()
  })

  it("still shows the projects error when a project is selected", () => {
    contextOverrides = { projectsError: true }
    renderPage()
    expect(screen.getByTestId("shops-error")).toBeInTheDocument()
  })

  it("shows the page-local error state with a retry action", async () => {
    const retry = vi.fn()
    useShopRecommendations.mockReturnValue({ status: "error", retry })
    renderPage()

    expect(screen.getByTestId("shops-error")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button"))
    expect(retry).toHaveBeenCalledOnce()
  })

  it("shows the nothing-to-buy state as one line, not a card, when every section is empty", () => {
    useShopRecommendations.mockReturnValue({ status: "ready", sections: [] })
    renderPage()
    const nothing = screen.getByTestId("shops-nothing")
    expect(nothing.tagName).toBe("P")
    expect(nothing).toHaveTextContent("state.nothingToBuy")
    expect(nothing).not.toHaveAttribute("data-slot", "card")
  })

  it("is a named card region with its own h2", () => {
    renderPage()
    expect(screen.getByRole("region", { name: "title" })).toHaveAttribute(
      "data-testid",
      "today-shops"
    )
    expect(
      screen.getByRole("heading", { level: 2, name: "title" })
    ).toBeInTheDocument()
  })

  it("uses the compact layout at a desktop width too, with a card per recommendation and its detail", () => {
    useShopRecommendations.mockReturnValue({
      status: "ready",
      sections: [section()],
    })
    renderPage()

    // The dashboard column is ~400-575px wide, so the compact layout is used at every width.
    expect(screen.getByTestId("shop-list")).toBeInTheDocument()
    expect(
      screen.getByTestId("shop-card-guild-shards_eldarFarseer")
    ).toHaveTextContent("Farseer shards")
    // progress + cost detail
    expect(screen.getByTestId("shop-list")).toHaveTextContent(
      'card.progress:{"acquired":30,"required":130}'
    )
    expect(screen.getByTestId("shop-list")).toHaveTextContent(
      "card.neededByLabel"
    )
    // the possible group carries the randomized-slot card
    expect(screen.getByTestId("shop-card-guild-upgHpM001")).toBeInTheDocument()
    expect(screen.getByTestId("shop-group-guaranteed")).toBeInTheDocument()
    expect(screen.getByTestId("shop-group-possible")).toBeInTheDocument()
    // Shop names and their groups nest under the section's h2.
    expect(
      screen.getByRole("heading", { level: 3, name: /^shopName\.guild/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 4, name: "group.guaranteed" })
    ).toBeInTheDocument()
  })

  it("renders the mobile layout as dense rows preserving the same detail", () => {
    useIsMobileMock.mockReturnValue(true)
    useShopRecommendations.mockReturnValue({
      status: "ready",
      sections: [section()],
    })
    renderPage()

    expect(screen.getByTestId("shop-list")).toBeInTheDocument()
    const card = screen.getByTestId("shop-card-guild-shards_eldarFarseer")
    expect(card).toHaveTextContent("Farseer shards")
    expect(card).toHaveTextContent(
      'card.progress:{"acquired":30,"required":130}'
    )
    // the per-day availability note must survive the mobile layout, not just desktop
    expect(card).toHaveTextContent('card.availableUpTo:{"max":2,"qty":5}')
  })
})
