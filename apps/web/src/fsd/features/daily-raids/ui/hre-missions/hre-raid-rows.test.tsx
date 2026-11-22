import { describe, expect, it, vi } from "vitest"
import type { BattleId, UpgradeId } from "@workspace/game-domain"
import { Rarity } from "@workspace/game-domain"

import { render, screen } from "@/test/render"

import type { MissionRaidPlan } from "../../model/mission-raids"
import { RaidRows } from "./hre-raids-extras"
import type { RaidRowsView } from "./hre-raids-extras"

vi.mock("react-i18next", () => {
  const translation = {
    i18n: { language: "en" },
    t: (key: string, values?: Record<string, unknown>) =>
      values
        ? `${key}|${Object.entries(values)
            .map(([name, value]) => `${name}=${String(value)}`)
            .join(",")}`
        : key,
  }
  return {
    initReactI18next: { type: "3rdParty", init: vi.fn() },
    useTranslation: () => translation,
  }
})

const row = (
  battleId: string,
  extra: Partial<MissionRaidPlan["rows"][number]> = {}
): MissionRaidPlan["rows"][number] => ({
  battleId: battleId as BattleId,
  energyCost: 6,
  raids: 1,
  energy: 6,
  goal: null,
  eventPoints: 0,
  ...extra,
})

const view = (nodeDrop?: RaidRowsView["nodeDrop"]): RaidRowsView => ({
  locations: undefined,
  view: null,
  nodeDrop,
})

describe("RaidRows", () => {
  it("shows a node's own drop with what the player holds when it feeds no goal", () => {
    render(
      <RaidRows
        rows={[row("I20")]}
        testId="rows"
        view={view(() => ({
          label: "Bolt pistol",
          visual: {
            kind: "upgrade",
            id: "upgBolt" as UpgradeId,
            rarity: Rarity.Rare,
            crafted: false,
          },
          owned: 7,
        }))}
      />
    )
    expect(screen.getByTestId("hre-raid-I20-owned")).toHaveTextContent(
      "hse.raids.owned|count=7"
    )
  })

  it("shows the enemies a battle defeats and the battle count on a second line", () => {
    render(
      <RaidRows
        battles
        rows={[row("I20", { enemies: 6 }), row("I21")]}
        testId="rows"
        view={view()}
      />
    )
    // On the row's second line, with the battle count.
    const details = screen.getByTestId("hre-raid-I20-details")
    expect(details).toHaveTextContent("raids.enemyCount|count=6")
    expect(details).toHaveTextContent("raids.battleCount|count=1")
    expect(screen.queryByTestId("hre-raid-I21-enemies")).toBeNull()
  })
})
