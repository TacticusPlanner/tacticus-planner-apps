import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import type { MissionRaidPlan } from "../../model/mission-raids"
import { HreCampaignOutlook } from "./hre-raids-extras"

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

// Only the fields the outlook reads.
const plan = (
  outlookNodes: { energyCost: number; dailyAttempts: number }[],
  dailyEnergy = 1000
) => ({ outlookNodes, dailyEnergy }) as unknown as MissionRaidPlan

describe("HreCampaignOutlook", () => {
  it("says no battles are left when the missions need none", () => {
    render(
      <HreCampaignOutlook
        plan={plan([{ energyCost: 3, dailyAttempts: 5 }])}
        remainingBattles={0}
        daysLeft={4}
      />
    )
    expect(screen.getByTestId("hre-campaign-summary")).toHaveTextContent(
      "raids.summary.none"
    )
  })

  it("names the shortfall when the battles cannot fit before the end", () => {
    // One node, 5 a day: 10 over 2 days, 30 needed, 20 short.
    render(
      <HreCampaignOutlook
        plan={plan([{ energyCost: 3, dailyAttempts: 5 }])}
        remainingBattles={30}
        daysLeft={2}
      />
    )
    expect(screen.getByTestId("hre-campaign-summary")).toHaveTextContent(
      "raids.summary.short|count=2,battles=30,max=5,short=20"
    )
  })

  it("shows the battle and pace chips but no energy chip without raidable nodes", () => {
    render(
      <HreCampaignOutlook plan={plan([])} remainingBattles={10} daysLeft={2} />
    )
    const summary = screen.getByTestId("hre-campaign-summary")
    expect(summary).toHaveTextContent("raids.summary.chipBattles|battles=10")
    expect(summary).toHaveTextContent(
      "raids.summary.chipPerDay|count=2,perDay=5"
    )
    expect(summary).not.toHaveTextContent("raids.summary.chipEnergy")
  })
})
