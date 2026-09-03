import { MemoryRouter, Outlet, Route, Routes } from "react-router"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import type { DailiesOutletContext } from "./dailies-layout"
import { ShopsPage } from "./shops-page"
import type {
  ShopRecommendationSectionView,
  ShopRecommendationsViewModel,
} from "../model/use-shop-recommendations"

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
vi.mock("../model/use-shop-recommendations", () => ({
  useShopRecommendations: () => useShopRecommendations(),
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: () => {} }))
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
        isActivePlan: true,
        isDefault: false,
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
          <Route index element={<ShopsPage />} />
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

describe("ShopsPage", () => {
  it("shows the loading state", () => {
    useShopRecommendations.mockReturnValue({ status: "loading" })
    renderPage()
    expect(screen.getByTestId("shops-loading")).toBeInTheDocument()
  })

  it("shows the no-project state when no project is available", () => {
    contextOverrides = { projectsUnavailable: true }
    renderPage()
    expect(screen.getByTestId("shops-no-project")).toBeInTheDocument()
  })

  it("shows the page-local error state with a retry action", async () => {
    const retry = vi.fn()
    useShopRecommendations.mockReturnValue({ status: "error", retry })
    renderPage()

    expect(screen.getByTestId("shops-error")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button"))
    expect(retry).toHaveBeenCalledOnce()
  })

  it("shows the nothing-to-buy state when every section is empty", () => {
    useShopRecommendations.mockReturnValue({ status: "ready", sections: [] })
    renderPage()
    expect(screen.getByTestId("shops-nothing")).toBeInTheDocument()
  })

  it("renders the desktop layout with a card per recommendation and its detail", () => {
    useShopRecommendations.mockReturnValue({
      status: "ready",
      sections: [section()],
    })
    renderPage()

    expect(screen.getByTestId("shops-desktop")).toBeInTheDocument()
    expect(
      screen.getByTestId("shop-card-guild-shards_eldarFarseer")
    ).toHaveTextContent("Farseer shards")
    // progress + cost detail
    expect(screen.getByTestId("shops-desktop")).toHaveTextContent(
      'card.progress:{"acquired":30,"required":130}'
    )
    expect(screen.getByTestId("shops-desktop")).toHaveTextContent(
      "card.neededByLabel"
    )
    // the possible group carries the randomized-slot card
    expect(screen.getByTestId("shop-card-guild-upgHpM001")).toBeInTheDocument()
    expect(screen.getByTestId("shop-group-guaranteed")).toBeInTheDocument()
    expect(screen.getByTestId("shop-group-possible")).toBeInTheDocument()
  })

  it("renders the mobile layout as dense rows preserving the same detail", () => {
    useIsMobileMock.mockReturnValue(true)
    useShopRecommendations.mockReturnValue({
      status: "ready",
      sections: [section()],
    })
    renderPage()

    expect(screen.getByTestId("shops-mobile")).toBeInTheDocument()
    expect(screen.queryByTestId("shops-desktop")).not.toBeInTheDocument()
    const card = screen.getByTestId("shop-card-guild-shards_eldarFarseer")
    expect(card).toHaveTextContent("Farseer shards")
    expect(card).toHaveTextContent(
      'card.progress:{"acquired":30,"required":130}'
    )
  })
})
