import { describe, expect, it } from "vitest"

import {
  hseRestrictionPasses,
  parseHseConfig,
  resolveHseVariant,
} from "./hse-scoring"
import { eventDefinitionSchema } from "./schemas"
import scoring from "./schemas/home-screen-event-scoring.fixture.json"

// The fixture is the real `home-screen-event-scoring.json` of tacticus-planner-api, in the shape the
// API serves under `config.hse` (a modifier omits the other kind's null fields).
const served = (definitionId: keyof typeof scoring) => ({
  id: definitionId,
  type: "HomeScreenEvent",
  recurrence: {
    kind: "None",
    intervalDays: null,
    durationDays: null,
    anchorUtc: null,
  },
  requiredParameters: [],
  config: { gameModes: ["Arena"], hse: scoring[definitionId] },
})

const parse = (definitionId: keyof typeof scoring) => {
  const definition = eventDefinitionSchema.parse(served(definitionId))
  const hse = parseHseConfig(definition.config)
  if (!hse) throw new Error(`${definitionId} has no config.hse`)
  return hse
}

describe("config.hse schema", () => {
  it("parses the served Psyker Boost payload: ladder, repeat, tracker and modifiers", () => {
    const hse = parse("hse-trait-boost-psyker")
    const [variant] = hse.variants

    expect(variant?.variantKey).toBe("default")
    expect(variant?.scope).toBe("Personal")
    expect(variant?.tiers.map((tier) => tier.tier)).toEqual([
      "High",
      "Mid",
      "Low",
    ])
    const high = variant!.tiers[0]!
    expect(
      high.milestones.map((milestone) => milestone.requiredPoints)
    ).toEqual([
      20, 40, 60, 80, 105, 135, 165, 195, 230, 270, 320, 370, 420, 470, 520,
      570, 645, 705, 765,
    ])
    expect(high.milestones[0]).toEqual({
      requiredPoints: 20,
      rewardId: "draft_abilityTokensUncommon",
      quantity: 3,
    })
    expect(high.repeat).toEqual({
      points: 50,
      rewardId: "draft_abilityTokensLegendary",
      quantity: 1,
      cap: null,
    })
    expect(variant?.tiers[1]?.milestones.at(-1)?.requiredPoints).toBe(605)
    expect(variant?.tiers[1]?.repeat?.points).toBe(40)
    expect(variant?.tiers[2]?.milestones.at(-1)?.requiredPoints).toBe(345)
    expect(variant?.tiers[2]?.repeat?.points).toBe(20)

    expect(variant?.trackers).toEqual([
      {
        kind: "KillUnits",
        points: 1,
        pointsByRarity: null,
        gameModes: {
          allowed: ["Arena", "SalvageRun", "Onslaught"],
          disallowed: null,
        },
        enemy: {
          tags: { allowed: null, disallowed: ["Summon", "Steppable"] },
          factionIds: null,
          unitIds: null,
        },
        player: {
          tags: { allowed: ["Psyker"], disallowed: null },
          factionIds: null,
          unitIds: null,
        },
      },
    ])
    expect(variant?.modifiers).toMatchObject([
      { kind: "StatBoost", healthPct: 20, damagePct: 20, armourPct: 20 },
      { kind: "UnitXp", multiplier: 3, sameFactionTeam: false },
    ])
    // Served without the other kind's fields.
    expect(variant?.modifiers[1]).not.toHaveProperty("multiplierByRarity")
  })

  it("parses Faction Boost's per-faction variants with a faction-targeted stat boost", () => {
    const hse = parse("hse-faction-boost")

    expect(hse.variants.map((variant) => variant.variantKey)).toEqual([
      "AdeptusMechanicus",
      "DarkAngels",
      "SpaceWolves",
    ])
    const darkAngels = hse.variants[1]!
    expect(darkAngels.tiers[0]?.milestones.at(-1)?.requiredPoints).toBe(1000)
    expect(darkAngels.tiers[0]?.repeat).toMatchObject({ points: 50, cap: 200 })
    expect(darkAngels.trackers.map((tracker) => tracker.points)).toEqual([2, 1])
    expect(darkAngels.trackers[1]?.player?.factionIds?.allowed).toEqual([
      "DarkAngels",
    ])
    expect(darkAngels.modifiers[1]).toMatchObject({
      kind: "StatBoost",
      player: { factionIds: { allowed: ["DarkAngels"] } },
    })
    expect(hse.variants[0]?.tiers[0]?.milestones.at(-1)?.requiredPoints).toBe(
      2000
    )
  })

  it("parses a rarity-scaled XP modifier (Training Rush) and battle trackers (Faction Focus)", () => {
    const rush = parse("hse-training-rush").variants[0]!
    expect(rush.modifiers[0]).toMatchObject({
      kind: "UnitXp",
      multiplierByRarity: { Common: 2.5, Mythic: 5 },
    })
    expect(rush.modifiers[0]).not.toHaveProperty("multiplier")

    const focus = parse("hse-faction-focus")
    expect(focus.variants[1]?.trackers.map((tracker) => tracker.kind)).toEqual([
      "DeployedUnitsOfFactionMajority",
      "DeployedUnitsOfFactionMajority",
      "FullLineUpOfFaction",
      "FullLineUpOfFaction",
    ])
  })

  it("also accepts explicit nulls for the other modifier kind's fields", () => {
    const hse = parseHseConfig({
      hse: {
        variants: [
          {
            ...scoring["hse-training-rush"].variants[0],
            modifiers: [
              {
                kind: "UnitXp",
                multiplier: null,
                multiplierByRarity: { Common: 2.5 },
                sameFactionTeam: false,
                gameModes: null,
                player: null,
              },
            ],
          },
        ],
      },
    })
    expect(hse?.variants[0]?.modifiers[0]).toMatchObject({ multiplier: null })
  })

  it("drops an unknown modifier kind and keeps an unknown tracker kind", () => {
    const variant = scoring["hse-trait-boost-psyker"].variants[0]!
    const hse = parseHseConfig({
      hse: {
        variants: [
          {
            ...variant,
            trackers: [
              ...variant.trackers,
              { ...variant.trackers[0], kind: "Future" },
            ],
            modifiers: [...variant.modifiers, { kind: "Future", value: 1 }],
          },
        ],
      },
    })
    expect(hse?.variants[0]?.modifiers).toHaveLength(2)
    expect(hse?.variants[0]?.trackers.map((tracker) => tracker.kind)).toEqual([
      "KillUnits",
      "Future",
    ])
  })

  it("reads no scoring from a definition without config.hse or with a broken one", () => {
    expect(parseHseConfig(null)).toBeNull()
    expect(parseHseConfig({ gameModes: ["Arena"] })).toBeNull()
    expect(parseHseConfig({ hse: { variants: [] } })).toBeNull()
  })
})

describe("resolveHseVariant", () => {
  it("picks the variant named by hseVariant", () => {
    const hse = parse("hse-faction-focus")
    const variant = resolveHseVariant(hse, { hseVariant: "october-2026" })
    expect(variant?.variantKey).toBe("october-2026")
    expect(variant?.tiers.map((tier) => tier.tier)).toEqual(["Default"])
    expect(variant?.tiers[0]?.milestones.at(-1)?.requiredPoints).toBe(1220)
    expect(variant?.tiers[0]?.repeat?.points).toBe(50)
  })

  it("picks the variant keyed by targetFactionId when there is no hseVariant", () => {
    const hse = parse("hse-faction-boost")
    expect(
      resolveHseVariant(hse, { targetFactionId: "DarkAngels" })?.variantKey
    ).toBe("DarkAngels")
  })

  it("falls back to default, and to nothing when no default exists", () => {
    expect(
      resolveHseVariant(parse("hse-faction-focus"), null)?.variantKey
    ).toBe("default")
    expect(
      resolveHseVariant(parse("hse-trait-boost-psyker"), {
        targetFactionId: "Orks",
      })?.variantKey
    ).toBe("default")
    expect(resolveHseVariant(parse("hse-faction-boost"), null)).toBeNull()
    expect(
      resolveHseVariant(parse("hse-faction-focus"), { hseVariant: "run-9" })
    ).toBeNull()
  })
})

describe("hseRestrictionPasses", () => {
  it("applies disallowed before allowed, and passes everything without a restriction", () => {
    expect(hseRestrictionPasses(null, "Arena")).toBe(true)
    expect(
      hseRestrictionPasses({ allowed: ["Arena"], disallowed: null }, "Arena")
    ).toBe(true)
    expect(
      hseRestrictionPasses(
        { allowed: ["Arena"], disallowed: null },
        "Onslaught"
      )
    ).toBe(false)
    expect(
      hseRestrictionPasses(
        { allowed: null, disallowed: ["Onslaught"] },
        "Onslaught"
      )
    ).toBe(false)
    expect(
      hseRestrictionPasses(
        { allowed: null, disallowed: ["Onslaught"] },
        "Arena"
      )
    ).toBe(true)
  })
})
