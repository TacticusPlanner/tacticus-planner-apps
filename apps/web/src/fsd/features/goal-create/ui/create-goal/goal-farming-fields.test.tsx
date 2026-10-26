import type { ComponentProps } from "react"
import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

vi.mock("@/features/shop-rewards/@x/goal-create", () => ({
  shopCurrencyIcon: () => "/icon.png",
}))

import { ProgressionPreview } from "./goal-farming-fields"

type Preview = NonNullable<ComponentProps<typeof ProgressionPreview>["preview"]>

const basePreview = (overrides: Partial<Preview>): Preview => ({
  regularShards: 20,
  mythicShards: 0,
  orbsByType: {},
  combined: null,
  combinedDays: 0,
  ascensionShardEnergy: null,
  ascensionMythicShardEnergy: null,
  ascensionNeedsRegularShards: true,
  ascensionNeedsMythicShards: false,
  onslaughtShardsPerRun: 0,
  onslaughtShardsPerDay: 0,
  onslaughtCurrentIsMythic: false,
  onslaughtProgressSaved: false,
  campaignShardsPerDay: 0,
  campaignMythicShardsPerDay: 0,
  shopShardsPerDaySelected: 0,
  onslaughtTokens: 0,
  shopCurrencySpend: [],
  ...overrides,
})

describe("ProgressionPreview acquisition-source contribution lines", () => {
  it("shows no Onslaught-token or shop-currency line for a campaign-only goal", () => {
    render(<ProgressionPreview preview={basePreview({})} />)

    expect(
      screen.queryByTestId("create-goal-preview-onslaught-tokens")
    ).not.toBeInTheDocument()
    expect(
      screen.queryAllByTestId(/create-goal-preview-currency-/)
    ).toHaveLength(0)
  })

  it("shows an Onslaught-token line and one line per shop currency when those sources contribute", () => {
    render(
      <ProgressionPreview
        preview={basePreview({
          onslaughtTokens: 3,
          shopCurrencySpend: [
            { currency: "guildCredits", amount: 2100 },
            { currency: "rogueTraderCurrency", amount: 40 },
          ],
        })}
      />
    )

    expect(
      screen.getByTestId("create-goal-preview-onslaught-tokens")
    ).toHaveTextContent("3 Onslaught tokens")
    expect(
      screen.getByTestId("create-goal-preview-currency-guildCredits")
    ).toHaveTextContent("2100 Guild Credits")
    expect(
      screen.getByTestId("create-goal-preview-currency-rogueTraderCurrency")
    ).toHaveTextContent("40 rogueTraderCurrency")
  })
})

describe("ProgressionPreview resources line", () => {
  it("merges the energy, raids and days into one line instead of repeating them", () => {
    render(
      <ProgressionPreview
        preview={basePreview({
          combined: {
            status: "Estimated",
            energyTotal: 1450,
            raidsTotal: 290,
            days: 29,
          } as Preview["combined"],
          combinedDays: 29,
          ascensionShardEnergy: {
            status: "Estimated",
            energyTotal: 1450,
          } as Preview["ascensionShardEnergy"],
        })}
      />
    )

    expect(
      screen.getByTestId("create-goal-progression-resource-line")
    ).toHaveTextContent("≈1450 energy (290 raids) · ≈29.0 days")
    expect(screen.queryByText(/1450 energy to obtain/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Combined duration/)).not.toBeInTheDocument()
    expect(screen.getAllByText(/1450/)).toHaveLength(1)
  })
})
