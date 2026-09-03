import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { ShopsBrowsePage } from "./shops-browse-page"
import type { LibraryShopsViewModel } from "./hooks/use-library-shops"
import type { LibraryShopSlotView } from "./library-shops.view-model"

const useLibraryShops = vi.fn<() => LibraryShopsViewModel>()
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
vi.mock("./hooks/use-library-shops", () => ({
  useLibraryShops: () => useLibraryShops(),
  LIBRARY_SHOP_IDS: ["guild", "war", "rogue-trader", "crusade"],
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: () => {} }))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

const singleSlot: LibraryShopSlotView = {
  kind: "single",
  rewards: [
    {
      rewardType: "shards_eldarFarseer",
      unitId: "eldarFarseer",
      qty: 5,
      cost: { currency: "guildCredits", amount: 525 },
      maxPerDay: 2,
      label: "Farseer shards",
    },
  ],
  uniformCost: true,
  costAmount: 525,
}

const randomSlot: LibraryShopSlotView = {
  kind: "random",
  rewards: [
    {
      rewardType: "shards_a",
      qty: 5,
      cost: { currency: "guildCredits", amount: 525 },
      maxPerDay: 2,
      label: "A shards",
    },
    {
      rewardType: "shards_b",
      qty: 5,
      cost: { currency: "guildCredits", amount: 525 },
      maxPerDay: 2,
      label: "B shards",
    },
  ],
  uniformCost: true,
  costAmount: 525,
}

function ready(
  overrides: Partial<Extract<LibraryShopsViewModel, { status: "ready" }>> = {}
): LibraryShopsViewModel {
  return {
    status: "ready",
    day: "MON",
    setDay: vi.fn(),
    shopId: "guild",
    setShopId: vi.fn(),
    slots: [singleSlot, randomSlot],
    ...overrides,
  }
}

beforeEach(() => {
  useIsMobileMock.mockReturnValue(false)
  useLibraryShops.mockReturnValue({ status: "loading" })
})

describe("ShopsBrowsePage", () => {
  it("renders without any auth prompt", () => {
    useLibraryShops.mockReturnValue(ready())
    render(<ShopsBrowsePage />)
    expect(screen.getByTestId("shops-browse-page")).toBeInTheDocument()
  })

  it("shows the loading state", () => {
    useLibraryShops.mockReturnValue({ status: "loading" })
    render(<ShopsBrowsePage />)
    expect(screen.getByTestId("shops-browse-loading")).toBeInTheDocument()
  })

  it("shows the load-failure state with a retry action", async () => {
    const retry = vi.fn()
    useLibraryShops.mockReturnValue({ status: "error", retry })
    render(<ShopsBrowsePage />)

    expect(screen.getByTestId("shops-browse-error")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button"))
    expect(retry).toHaveBeenCalledOnce()
  })

  it("shows the per-day empty state when a shop has no slots", () => {
    useLibraryShops.mockReturnValue(ready({ slots: [] }))
    render(<ShopsBrowsePage />)
    expect(screen.getByTestId("shops-browse-empty")).toBeInTheDocument()
  })

  it("renders the desktop layout: a card per slot, random slot kept as one unit", () => {
    useLibraryShops.mockReturnValue(ready())
    render(<ShopsBrowsePage />)

    expect(screen.getByTestId("shops-browse-desktop")).toBeInTheDocument()
    expect(screen.getByTestId("shops-day-toggle")).toBeInTheDocument()
    expect(screen.getByTestId("shops-shop-toggle")).toBeInTheDocument()

    expect(screen.getByTestId("shop-slot-0")).toHaveTextContent(
      "Farseer shards"
    )
    const random = screen.getByTestId("shop-slot-1")
    expect(random).toHaveAttribute("data-random", "true")
    expect(random).toHaveTextContent('shops.randomSlot:{"count":2}')
    // both possibilities are listed under the one card, not as separate slots
    expect(random).toHaveTextContent("A shards")
    expect(random).toHaveTextContent("B shards")
    expect(screen.queryByTestId("shop-slot-2")).not.toBeInTheDocument()
  })

  it("renders a distinct mobile layout with dropdown controls", () => {
    useIsMobileMock.mockReturnValue(true)
    useLibraryShops.mockReturnValue(ready())
    render(<ShopsBrowsePage />)

    expect(screen.getByTestId("shops-browse-mobile")).toBeInTheDocument()
    expect(screen.queryByTestId("shops-browse-desktop")).not.toBeInTheDocument()
    expect(screen.getByTestId("shops-day-select")).toBeInTheDocument()
    expect(screen.getByTestId("shops-shop-select")).toBeInTheDocument()
    expect(screen.getByTestId("shop-slot-0")).toHaveTextContent(
      "Farseer shards"
    )
  })
})
