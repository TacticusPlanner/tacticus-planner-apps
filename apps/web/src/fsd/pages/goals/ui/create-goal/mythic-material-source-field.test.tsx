import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import type { ShopRewardOffer } from "@workspace/game-catalog"

import { render, screen } from "@/test/render"
import type { MythicMaterialSelection } from "../../model/goal-creation-form/use-mythic-material-selection"

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

import { MythicMaterialSourceField } from "./mythic-material-source-field"

const venerable = (
  shopId: string,
  maxPerDay: number,
  probabilityByDay: ShopRewardOffer["probabilityByDay"]
): ShopRewardOffer => ({
  offerId: `${shopId}:upgHpM004`,
  shopId,
  rewardType: "upgHpM004",
  rewardQty: 1,
  cost: { currency: "guildCredits", amount: 900 },
  maxPerDay,
  days: Object.keys(probabilityByDay) as ShopRewardOffer["days"],
  probabilityByDay,
})

const offers = [
  venerable("guild", 2, { TUE: 1, SAT: 0.25, SUN: 0.25 }),
  venerable("crusade", 3, { TUE: 1, SAT: 0.25, SUN: 0.25 }),
  venerable("rogue-trader", 1, { SUN: 1 }),
]

function selection(
  overrides: Partial<MythicMaterialSelection> = {}
): MythicMaterialSelection {
  return {
    materialIds: ["upgHpM004"],
    offers,
    failed: false,
    checkedIds: offers.map((offer) => offer.offerId),
    toggle: vi.fn(),
    acquisitionSources: null,
    changed: false,
    currencySpend: [],
    reset: vi.fn(),
    ...overrides,
  }
}

const checkbox = (offerId: string) =>
  screen.getByTestId(`create-goal-shop-offer-checkbox-${offerId}`)

describe("MythicMaterialSourceField", () => {
  it("lists every offer of the needed material, checked by default", () => {
    render(<MythicMaterialSourceField selection={selection()} />)

    for (const offer of offers) {
      expect(checkbox(offer.offerId)).toBeChecked()
    }
    expect(
      screen.getByTestId("create-goal-shop-offer-yield-crusade:upgHpM004")
    ).toHaveTextContent("goals.create.mythicMaterials.perDay")
  })

  it("marks only the rotating days of an offer that is guaranteed on another day", () => {
    render(<MythicMaterialSourceField selection={selection()} />)

    expect(
      screen.getByTestId("create-goal-shop-offer-possible-guild:upgHpM004")
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId(
        "create-goal-shop-offer-possible-rogue-trader:upgHpM004"
      )
    ).not.toBeInTheDocument()
  })

  it("reports a toggle", async () => {
    const toggle = vi.fn()
    render(<MythicMaterialSourceField selection={selection({ toggle })} />)

    await userEvent.click(checkbox("rogue-trader:upgHpM004"))

    expect(toggle).toHaveBeenCalledWith("rogue-trader:upgHpM004", false)
  })

  it("renders nothing when no Mythic material is needed", () => {
    render(
      <MythicMaterialSourceField selection={selection({ materialIds: [] })} />
    )

    expect(
      screen.queryByTestId("goal-mythic-material-sources")
    ).not.toBeInTheDocument()
  })

  it("shows a loading state while offers resolve", () => {
    render(
      <MythicMaterialSourceField selection={selection({ offers: undefined })} />
    )

    expect(
      screen.getByTestId("goal-mythic-material-sources-loading")
    ).toBeInTheDocument()
  })

  it("reports a load failure", () => {
    render(
      <MythicMaterialSourceField
        selection={selection({ offers: undefined, failed: true })}
      />
    )

    expect(
      screen.getByTestId("goal-mythic-material-sources-failed")
    ).toBeInTheDocument()
  })

  it("says so when a needed material has no offer", () => {
    render(
      <MythicMaterialSourceField
        selection={selection({ materialIds: ["upgHpM001"] })}
      />
    )

    expect(
      screen.getByText("goals.create.mythicMaterials.noOffers")
    ).toBeInTheDocument()
  })

  it("shows each currency's spend", () => {
    render(
      <MythicMaterialSourceField
        selection={selection({
          currencySpend: [{ currency: "crusadeCurrency", amount: 1720 }],
        })}
      />
    )

    expect(
      screen.getByTestId("goal-mythic-material-spend-crusadeCurrency")
    ).toBeInTheDocument()
  })

  it("collapses a material with several offers below 768px, with the same rows once expanded", async () => {
    useIsMobileMock.mockReturnValue(true)
    render(<MythicMaterialSourceField selection={selection()} />)

    expect(
      screen.queryByTestId("create-goal-shop-offer-guild:upgHpM004")
    ).not.toBeInTheDocument()

    await userEvent.click(
      screen.getByTestId("goal-mythic-material-upgHpM004-header")
    )

    for (const offer of offers) {
      expect(checkbox(offer.offerId)).toBeChecked()
    }
    useIsMobileMock.mockReturnValue(false)
  })
})
