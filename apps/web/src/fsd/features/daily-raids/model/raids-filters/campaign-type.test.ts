import { describe, expect, it } from "vitest"

import shapes from "./campaign-battle-shapes.fixture.json"
import { buildRaidsFilterBattles, raidsCampaignTypeOf } from "./campaign-type"
import { RAIDS_CAMPAIGN_TYPES } from "./raids-filters.domain"

// `campaign-battle-shapes.fixture.json` is every distinct (campaign group, type, energy cost) the
// served `campaign-battles` dataset holds (1316 battles, game version 1.42) with its group's release type.
const shape = (
  campaignGroupId: string,
  type: string,
  energyCost: number,
  releaseType: string
) => ({ campaignGroupId, type, energyCost, releaseType })

describe("raidsCampaignTypeOf", () => {
  it("maps Elite and Mirror Elite to Elite, Mirror to Mirror", () => {
    expect(
      raidsCampaignTypeOf(shape("elite1", "Elite", 6, "standard"), "standard")
    ).toBe("Elite")
    expect(
      raidsCampaignTypeOf(
        shape("eliteMirror1", "EliteMirror", 6, "standard"),
        "standard"
      )
    ).toBe("Elite")
    expect(
      raidsCampaignTypeOf(shape("mirror1", "Mirror", 6, "standard"), "standard")
    ).toBe("Mirror")
  })

  it("splits Standard by release type: event Standard, storyline Normal", () => {
    expect(
      raidsCampaignTypeOf(
        shape("eventCampaign1", "Standard", 6, "event"),
        "event"
      )
    ).toBe("Standard")
    expect(
      raidsCampaignTypeOf(
        shape("eventCampaign1", "Extremis", 6, "event"),
        "event"
      )
    ).toBe("Extremis")
    expect(
      raidsCampaignTypeOf(
        shape("campaign2", "Standard", 6, "standard"),
        "standard"
      )
    ).toBe("Normal")
  })

  it("maps only five-energy Indomitus Standard battles to Early", () => {
    expect(
      raidsCampaignTypeOf(
        shape("campaign1", "Standard", 5, "standard"),
        "standard"
      )
    ).toBe("Early")
    expect(
      raidsCampaignTypeOf(
        shape("campaign1", "Standard", 6, "standard"),
        "standard"
      )
    ).toBe("Normal")
    expect(
      raidsCampaignTypeOf(
        shape("campaign1", "Standard", 3, "standard"),
        "standard"
      )
    ).toBeNull()
    expect(
      raidsCampaignTypeOf(
        shape("campaign1", "Standard", 0, "standard"),
        "standard"
      )
    ).toBeNull()
  })

  it("maps every real catalog battle to exactly one option (none for Indomitus SuperEarly)", () => {
    expect(shapes.length).toBeGreaterThan(0)
    for (const row of shapes) {
      const mapped = raidsCampaignTypeOf(row, row.releaseType)
      const superEarly =
        row.campaignGroupId === "campaign1" &&
        row.type === "Standard" &&
        row.energyCost < 5
      if (superEarly) {
        expect(mapped, JSON.stringify(row)).toBeNull()
      } else {
        expect(RAIDS_CAMPAIGN_TYPES, JSON.stringify(row)).toContain(mapped)
      }
    }
  })

  it("keeps V1's Early count: 15 five-energy Indomitus nodes", () => {
    const early = shapes
      .filter((row) => raidsCampaignTypeOf(row, row.releaseType) === "Early")
      .reduce((total, row) => total + row.battles, 0)
    expect(early).toBe(15)
  })
})

describe("buildRaidsFilterBattles enemy traits", () => {
  const battle = {
    id: "b1",
    campaignGroupId: "campaign2",
    type: "Standard",
    energyCost: 6,
    slots: 5,
    alliesAlliance: "Imperial",
    alliesFactions: [],
    enemiesAlliances: [],
    enemiesFactions: [],
    enemiesTotal: 2,
    enemiesTypes: [],
    detailedEnemyTypes: [
      { id: "bot", count: 1 },
      { id: "ghost", count: 1 },
    ],
  } as unknown as Parameters<typeof buildRaidsFilterBattles>[0][number]

  it("fills each battle's traits from its enemies' npc records", () => {
    const result = buildRaidsFilterBattles(
      [battle],
      [],
      new Map([["bot", { traits: ["Mechanical"] }]])
    )
    expect(result.get("b1")?.enemiesTraits).toEqual(["Mechanical"])
  })

  it("leaves battles trait-less while the npc dataset is loading", () => {
    expect(
      buildRaidsFilterBattles([battle], []).get("b1")?.enemiesTraits
    ).toEqual([])
  })
})
