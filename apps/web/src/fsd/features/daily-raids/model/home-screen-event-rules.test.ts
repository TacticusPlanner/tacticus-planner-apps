import { describe, expect, it } from "vitest"

import {
  hseDefinitionConfig,
  hseVariant,
  type HseFixtureId,
} from "@/test/fixtures/home-screen-event-scoring"

import {
  battleEventPoints,
  campaignBattleGameMode,
  eventCampaignGroupIds,
  homeScreenEventRaidRule,
  type RuleBattle,
  type RuleNpc,
} from "./home-screen-event-rules"

const npc = (partial: Partial<RuleNpc> = {}): RuleNpc => ({
  factionId: "Necrons",
  alliance: "Xenos",
  traits: [],
  ...partial,
})
const npcs = new Map<string, RuleNpc>([
  ["mech", npc({ traits: ["Mechanical"] })],
  ["mech-summon", npc({ traits: ["Mechanical", "Summon"] })],
  ["mech-steppable", npc({ traits: ["Mechanical", "Steppable"] })],
  ["mechanic", npc({ traits: ["Mechanic"] })],
  ["chaos", npc({ alliance: "Chaos", factionId: "DeathGuard" })],
  ["tyranid", npc({ factionId: "Tyranids" })],
  ["plain", npc()],
])
const EVENT_GROUP = "eventCampaign1"
const eventGroupIds = new Set([EVENT_GROUP])
const battle = (type: string, ...enemies: [string, number][]): RuleBattle => ({
  type,
  campaignGroupId: "campaign1",
  detailedEnemyTypes: enemies.map(([id, count]) => ({ id, count })),
})
const eventBattle = (...enemies: [string, number][]): RuleBattle => ({
  ...battle("Standard", ...enemies),
  campaignGroupId: EVENT_GROUP,
})
const ruleOf = (definitionId: HseFixtureId, parameters?: object) =>
  homeScreenEventRaidRule(
    hseDefinitionConfig(definitionId),
    parameters as Record<string, unknown> | undefined
  )
const points = (definitionId: HseFixtureId, value: RuleBattle) =>
  battleEventPoints(ruleOf(definitionId), value, npcs, eventGroupIds)

// Purge Order is in the API's datamine mapping but not in the fixture copy; its trackers as served.
const purgeOrderTracker = (points: number, allowed: string[]) => ({
  kind: "KillUnits",
  points,
  pointsByRarity: null,
  gameModes: { allowed, disallowed: null },
  enemy: {
    tags: { allowed: null, disallowed: ["Summon", "Steppable"] },
    factionIds: { allowed: ["Tyranids"], disallowed: null },
    unitIds: null,
  },
  player: null,
})
const purgeOrderConfig = {
  hse: {
    variants: [
      {
        ...hseVariant("hse-warp-surge"),
        trackers: [
          purgeOrderTracker(3, ["Campaign", "MirrorCampaign", "CampaignEvent"]),
          purgeOrderTracker(5, ["EliteCampaign", "MirrorEliteCampaign"]),
        ],
      },
    ],
  },
}

describe("homeScreenEventRaidRule", () => {
  it("has a rule for the events whose served trackers score campaign raids", () => {
    for (const id of [
      "hse-warp-surge",
      "hse-machine-hunt",
      "hse-training-rush",
    ] as const) {
      expect(ruleOf(id)).not.toBeNull()
    }
    expect(homeScreenEventRaidRule(purgeOrderConfig, {})).not.toBeNull()
  })

  it("has none for events scored outside campaigns or by the deployed team", () => {
    for (const id of [
      "hse-faction-boost",
      "hse-squig-smash",
      "hse-faction-focus",
      "hse-defeat-waves",
      "hse-arsenal-of-war",
      "hse-11th-edition-week-2",
    ] as const) {
      expect(ruleOf(id, { targetFactionId: "DarkAngels" })).toBeNull()
    }
  })

  it("has none without `config.hse` (Against the Tide) or with a config that does not parse", () => {
    expect(homeScreenEventRaidRule({}, null)).toBeNull()
    expect(homeScreenEventRaidRule(undefined, null)).toBeNull()
    expect(homeScreenEventRaidRule({ hse: { variants: [] } }, null)).toBeNull()
  })

  it("returns the same rule for the same served config", () => {
    const config = hseDefinitionConfig("hse-machine-hunt")
    expect(homeScreenEventRaidRule(config, null)).toBe(
      homeScreenEventRaidRule(config, {})
    )
  })
})

describe("campaignBattleGameMode", () => {
  it("maps campaign types to the catalog game modes", () => {
    expect(campaignBattleGameMode(battle("Standard"), eventGroupIds)).toBe(
      "Campaign"
    )
    expect(campaignBattleGameMode(battle("Mirror"), eventGroupIds)).toBe(
      "MirrorCampaign"
    )
    expect(campaignBattleGameMode(battle("Elite"), eventGroupIds)).toBe(
      "EliteCampaign"
    )
    expect(campaignBattleGameMode(battle("EliteMirror"), eventGroupIds)).toBe(
      "MirrorEliteCampaign"
    )
    expect(campaignBattleGameMode(battle("Unknown"), eventGroupIds)).toBeNull()
  })

  it("plays every event-campaign node, Extremis included, as CampaignEvent", () => {
    expect(campaignBattleGameMode(eventBattle(), eventGroupIds)).toBe(
      "CampaignEvent"
    )
    expect(campaignBattleGameMode(battle("Extremis"), new Set())).toBe(
      "CampaignEvent"
    )
  })

  it("reads the event groups from the campaign definitions' release type", () => {
    expect([
      ...eventCampaignGroupIds([
        { groupId: "campaign1", releaseType: "standard" },
        { groupId: EVENT_GROUP, releaseType: "event" },
      ]),
    ]).toEqual([EVENT_GROUP])
  })
})

describe("battleEventPoints", () => {
  it("scores an Elite Machine Hunt node 5 per Mechanical enemy", () => {
    expect(points("hse-machine-hunt", battle("Elite", ["mech", 4]))).toBe(20)
  })

  it("scores a Standard node 3 per matching enemy and EliteMirror 5", () => {
    expect(points("hse-machine-hunt", battle("Standard", ["mech", 4]))).toBe(12)
    expect(points("hse-machine-hunt", battle("EliteMirror", ["mech", 2]))).toBe(
      10
    )
    expect(points("hse-machine-hunt", battle("Mirror", ["mech", 2]))).toBe(6)
    expect(points("hse-machine-hunt", eventBattle(["mech", 2]))).toBe(6)
  })

  it("never counts Summon or Steppable enemies or the Mechanic trait", () => {
    expect(
      points(
        "hse-machine-hunt",
        battle(
          "Standard",
          ["mech", 2],
          ["mech-summon", 1],
          ["mech-steppable", 1],
          ["mechanic", 1]
        )
      )
    ).toBe(6)
  })

  it("matches Warp Surge on Chaos enemies and Purge Order on Tyranids", () => {
    expect(
      points("hse-warp-surge", battle("Standard", ["chaos", 2], ["plain", 3]))
    ).toBe(6)
    expect(points("hse-warp-surge", battle("Elite", ["chaos", 2]))).toBe(10)
    expect(points("hse-warp-surge", eventBattle(["chaos", 1]))).toBe(3)
    const purgeOrder = homeScreenEventRaidRule(purgeOrderConfig, null)
    expect(
      battleEventPoints(
        purgeOrder,
        battle("Standard", ["tyranid", 5], ["plain", 1]),
        npcs,
        eventGroupIds
      )
    ).toBe(15)
    expect(
      battleEventPoints(
        purgeOrder,
        battle("Elite", ["tyranid", 2]),
        npcs,
        eventGroupIds
      )
    ).toBe(10)
  })

  it("scores every enemy for Training Rush", () => {
    expect(
      points("hse-training-rush", battle("Elite", ["plain", 2], ["chaos", 1]))
    ).toBe(15)
  })

  it("gives no points without a rule, to unresolved enemies or to an unknown battle type", () => {
    expect(
      battleEventPoints(null, battle("Elite", ["mech", 4]), npcs, eventGroupIds)
    ).toBe(0)
    expect(
      points("hse-training-rush", battle("Standard", ["missing", 4]))
    ).toBe(0)
    expect(points("hse-training-rush", battle("Unknown", ["plain", 4]))).toBe(0)
  })
})
