import type { ReactElement } from "react"
import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import type { ShopShardOffer } from "@workspace/game-catalog"
import {
  battleIdSchema,
  campaignIdSchema,
  type BattleId,
} from "@workspace/game-domain"

import { render as testingLibraryRender, screen } from "@/test/render"
import type { Battle, FarmLocation } from "@/features/goal-farming"

// The Onslaught panel renders a react-router `Link`, so every render needs a router in scope —
// unlike `create-goal-sheet.test.tsx`, which never exercises that branch (Onslaught starts
// unselected there).
function render(ui: ReactElement) {
  return testingLibraryRender(<MemoryRouter>{ui}</MemoryRouter>)
}

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({ t: (key: string) => key }),
}))

const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

import { AcquisitionSourceField } from "./acquisition-source-field"

const battleId = battleIdSchema.parse
const campaignId = campaignIdSchema.parse

const location = (id: string, isMythic = false): FarmLocation => ({
  battleId: battleId(id),
  guaranteed: true,
  numerator: null,
  denominator: null,
  effectiveRate: null,
  isMythic,
})

const battlesById = new Map<BattleId, Battle>([
  [
    battleId("B1"),
    {
      campaignGroupId: campaignId("campaign1"),
      type: "Standard",
      challenge: false,
      nodeNumber: 1,
      energyCost: 10,
      dailyAttempts: 10,
    },
  ],
])

const guaranteedOffer: ShopShardOffer = {
  offerId: "guild:shards_hero1",
  shopId: "guild",
  unitId: "hero1",
  rewardType: "shards_hero1",
  isMythic: false,
  rewardQty: 5,
  cost: { currency: "guildCredits", amount: 525 },
  maxPerDay: 2,
  days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
  probabilityByDay: {
    MON: 1,
    TUE: 1,
    WED: 1,
    THU: 1,
    FRI: 1,
    SAT: 1,
    SUN: 1,
  },
}

const rotatingOffer: ShopShardOffer = {
  ...guaranteedOffer,
  offerId: "guild:shards_hero2",
  unitId: "hero2",
  rewardType: "shards_hero2",
  days: ["TUE", "FRI"],
  probabilityByDay: { TUE: 0.5, FRI: 0.5 },
}

function baseProps() {
  return {
    showCampaigns: false,
    campaignEnabled: true,
    onCampaignEnabledChange: vi.fn(),
    regularShardLocations: [] as FarmLocation[],
    mythicShardLocations: [] as FarmLocation[],
    battlesById,
    selectedShardLocationIds: [] as string[],
    onToggleShardLocation: vi.fn(),
    showOnslaught: false,
    onslaughtEnabled: false,
    onOnslaughtEnabledChange: vi.fn(),
    onslaughtShardsPerRun: 0,
    onslaughtProgressSaved: false,
    shopOffers: undefined as ShopShardOffer[] | undefined,
    shopsEnabled: false,
    onShopsEnabledChange: vi.fn(),
    selectedShopOfferIds: [] as string[],
    onToggleShopOffer: vi.fn(),
  }
}

describe("AcquisitionSourceField", () => {
  it("renders nothing when no group can contribute", () => {
    const { container } = render(<AcquisitionSourceField {...baseProps()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("shows the Campaigns group and its regular/mythic node lists when locations exist", () => {
    render(
      <AcquisitionSourceField
        {...baseProps()}
        mythicShardLocations={[location("B2", true)]}
        regularShardLocations={[location("B1")]}
        showCampaigns
      />
    )

    expect(
      screen.getByTestId("create-goal-acquisition-group-campaigns")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("create-goal-shard-locations-regular")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("create-goal-shard-locations-mythic")
    ).toBeInTheDocument()
  })

  it("calls onCampaignEnabledChange when the group checkbox is toggled", async () => {
    const onCampaignEnabledChange = vi.fn()
    render(
      <AcquisitionSourceField
        {...baseProps()}
        onCampaignEnabledChange={onCampaignEnabledChange}
        regularShardLocations={[location("B1")]}
        showCampaigns
      />
    )

    await userEvent.click(
      screen.getByTestId("create-goal-acquisition-group-campaigns-toggle")
    )

    expect(onCampaignEnabledChange).toHaveBeenCalledWith(false)
  })

  it("does not render the Onslaught group when showOnslaught is false", () => {
    render(
      <AcquisitionSourceField
        {...baseProps()}
        regularShardLocations={[location("B1")]}
        showCampaigns
        showOnslaught={false}
      />
    )

    expect(
      screen.queryByTestId("create-goal-acquisition-group-onslaught")
    ).not.toBeInTheDocument()
  })

  it("shows the Onslaught yield when checked and progress is saved", () => {
    render(
      <AcquisitionSourceField
        {...baseProps()}
        onslaughtEnabled
        onslaughtProgressSaved
        onslaughtShardsPerRun={4.5}
        showOnslaught
      />
    )

    const panel = screen.getByTestId("create-goal-onslaught-panel")
    expect(panel).toHaveTextContent(
      "goals.create.acquisitionSources.onslaughtYield"
    )
  })

  it("shows the set-progress prompt when checked but no progress is saved", () => {
    render(
      <AcquisitionSourceField
        {...baseProps()}
        onslaughtEnabled
        onslaughtProgressSaved={false}
        showOnslaught
      />
    )

    const panel = screen.getByTestId("create-goal-onslaught-panel")
    expect(panel).toHaveTextContent(
      "goals.create.acquisitionSources.onslaughtNoProgress"
    )
  })

  it("marks a rotating-slot offer as a possible reward but not a guaranteed one", () => {
    render(
      <AcquisitionSourceField
        {...baseProps()}
        shopOffers={[guaranteedOffer, rotatingOffer]}
      />
    )

    expect(
      screen.queryByTestId(
        `create-goal-shop-offer-possible-${guaranteedOffer.offerId}`
      )
    ).not.toBeInTheDocument()
    expect(
      screen.getByTestId(
        `create-goal-shop-offer-possible-${rotatingOffer.offerId}`
      )
    ).toBeInTheDocument()
  })

  it("toggles a shop offer's selection", async () => {
    const onToggleShopOffer = vi.fn()
    render(
      <AcquisitionSourceField
        {...baseProps()}
        onToggleShopOffer={onToggleShopOffer}
        shopOffers={[guaranteedOffer]}
      />
    )

    await userEvent.click(
      screen.getByTestId(
        `create-goal-shop-offer-checkbox-${guaranteedOffer.offerId}`
      )
    )

    expect(onToggleShopOffer).toHaveBeenCalledWith(
      guaranteedOffer.offerId,
      true
    )
  })

  it("starts groups expanded on desktop and collapsed on mobile, same options either way", () => {
    useIsMobileMock.mockReturnValue(false)
    const desktop = render(
      <AcquisitionSourceField
        {...baseProps()}
        shopOffers={[guaranteedOffer]}
        showCampaigns={false}
      />
    )
    expect(
      desktop.getByTestId(`create-goal-shop-offer-${guaranteedOffer.offerId}`)
    ).toBeInTheDocument()
    desktop.unmount()

    useIsMobileMock.mockReturnValue(true)
    const mobile = render(
      <AcquisitionSourceField
        {...baseProps()}
        shopOffers={[guaranteedOffer]}
        showCampaigns={false}
      />
    )
    expect(
      mobile.queryByTestId(`create-goal-shop-offer-${guaranteedOffer.offerId}`)
    ).not.toBeInTheDocument()
    expect(
      mobile.getByTestId("create-goal-acquisition-group-shops-header")
    ).toBeInTheDocument()
  })
})
