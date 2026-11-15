import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen, within } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"
import { setViewportWidth } from "@/test/viewport"
import { lysanderBattleNpcs } from "@/test/fixtures/lysander-battles"
import dailiesEn from "../../../../../public/locales/en/dailies.json"

import { CampaignBattleDialog } from "./campaign-battle-dialog"

// Archimatos's served ladder opens at rank 5 / 5 stars, then rank 8 (Bronze III) / 5 stars.
const battle = {
  id: "indomitusElite40",
  campaignGroupId: "elite1",
  type: "Elite",
  challenge: false,
  nodeNumber: 40,
  battleIndex: 39,
  slots: 5,
  dailyAttempts: 6,
  energyCost: 10,
  enemyPower: 12_345,
  enemiesTotal: 4,
  detailedEnemyTypes: [
    {
      id: "blackBossPossession",
      name: "Archimatos",
      count: 3,
      rank: "Bronze3",
      stars: 5,
    },
    { id: "unknownNpc", name: "Unknown", count: 1, rank: "Stone1", stars: 0 },
  ],
}

let i18n: I18n

describe("CampaignBattleDialog", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en", { en: { dailies: dailiesEn } })
  })
  beforeEach(async () => {
    vi.unstubAllGlobals()
    setViewportWidth(1280)
    await seedGameCatalog({
      "campaign-battles": [battle],
      npcs: lysanderBattleNpcs,
    })
  })

  it("shows the location's energy, slots, power and enemies with their level", async () => {
    render(
      <CampaignBattleDialog
        onClose={() => {}}
        target={{
          battleId: battle.id,
          title: {
            campaignName: "Indomitus",
            difficultyLabel: "Elite",
            nodeLabel: "Elite 40",
          },
        }}
      />,
      { route: "/", wrapper: i18nWrapper(i18n) }
    )

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("heading", { level: 2 })).toHaveTextContent(
      "Indomitus Elite 40"
    )
    const summary = await within(dialog).findByTestId("campaign-battle-summary")
    expect(summary).toHaveTextContent("10 energy")
    expect(summary).toHaveTextContent("5 unit slots")
    expect(summary).toHaveTextContent("Enemy power 12,345")
    expect(
      within(dialog).getByTestId("campaign-battle-enemies")
    ).toHaveTextContent("Enemies 4 enemies")

    const tiles = await within(dialog).findAllByTestId("battle-enemy-tile")
    expect(
      tiles.map((tile) => [
        tile.getAttribute("data-npc"),
        tile.getAttribute("data-level"),
      ])
    ).toEqual([
      ["blackBossPossession", "resolved"],
      ["unknownNpc", "unknownLevel"],
    ])
  })

  it("says so when the battle is not in the game data", async () => {
    render(
      <CampaignBattleDialog
        onClose={() => {}}
        target={{ battleId: "missing", title: { campaignName: "missing" } }}
      />,
      { route: "/", wrapper: i18nWrapper(i18n) }
    )

    expect(
      await screen.findByText("This battle isn't in the game data.")
    ).toBeInTheDocument()
  })

  it("renders nothing while no location is picked", () => {
    render(<CampaignBattleDialog onClose={() => {}} target={null} />, {
      route: "/",
      wrapper: i18nWrapper(i18n),
    })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
