import { describe, expect, it } from "vitest"

import {
  CLEAR_ESTIMATE_CALIBRATED,
  CLEAR_ESTIMATE_CURVE,
  clearEstimateConfig,
  estimateClearDepth,
  laneBattlePowers,
  lockedMemberCount,
  requiredClearPower,
  teamClearEstimate,
  teamEffectiveDepth,
  teamEffectivePower,
  teamPower,
  unitClearEstimate,
  unitHordeMultiplier,
  unitEffectivePower,
  unitPower,
} from "./clear-estimate"
import {
  UNAVAILABLE_CONFIG,
  UTHAR_ALPHA_POWERS,
  WORKED_CONFIG,
  WORKED_TEAM,
  rosterOf,
  rosterUnit,
} from "./clear-estimate.fixtures"

const roster = rosterOf(WORKED_TEAM)

describe("clear estimate (spec worked examples)", () => {
  it("computes the worked Uthar Alpha team: E 102,229.4, depth 6, 12% above, 37% short", () => {
    const powers = WORKED_TEAM.map((unitId) =>
      unitPower(unitId, roster, WORKED_CONFIG.unitPower)
    )
    expect(powers).toEqual([21675, 16672, 21883, 24753, 13912])
    expect(unitEffectivePower("ultraCalgar", roster, WORKED_CONFIG)).toBe(21675)
    expect(
      unitEffectivePower("ultraTigurius", roster, WORKED_CONFIG)
    ).toBeCloseTo(20006.4, 6)
    const power = teamEffectivePower(WORKED_TEAM, roster, WORKED_CONFIG)
    expect(power).toBeCloseTo(102229.4, 6)

    const thresholds = UTHAR_ALPHA_POWERS.map(
      (battle) => WORKED_CONFIG.powerRatio * battle
    )
    for (const [index, expected] of [
      1221.6, 3666, 9838.8, 24843.6, 48703.2, 90944.4, 161523.6,
    ].entries()) {
      expect(thresholds[index]).toBeCloseTo(expected, 6)
    }

    expect(
      estimateClearDepth(power!, UTHAR_ALPHA_POWERS, WORKED_CONFIG)
    ).toEqual({
      depth: 6,
      sureDepth: 6,
      stretchDepth: 6,
      battleCount: 7,
      power,
      marginAbovePct: 12,
      shortfallToNextPct: 37,
      calibrated: true,
    })
  })

  it("sums fewer members for a partial team: E 68,311 clears 5", () => {
    const partial = ["ultraCalgar", "ultraTitus", "ultraApothecary"]
    expect(teamEffectivePower(partial, roster, WORKED_CONFIG)).toBe(68311)
    expect(
      teamClearEstimate(partial, UTHAR_ALPHA_POWERS, roster, WORKED_CONFIG)
        ?.depth
    ).toBe(5)
  })

  it("adds nothing for a locked member: E 80,346.4 clears 5", () => {
    const withoutTitus = rosterOf(
      WORKED_TEAM.filter((unitId) => unitId !== "ultraTitus")
    )
    expect(unitPower("ultraTitus", withoutTitus, WORKED_CONFIG.unitPower)).toBe(
      0
    )
    expect(
      teamEffectivePower(WORKED_TEAM, withoutTitus, WORKED_CONFIG)
    ).toBeCloseTo(80346.4, 6)
    expect(lockedMemberCount(WORKED_TEAM, withoutTitus)).toBe(1)
    expect(
      teamClearEstimate(
        WORKED_TEAM,
        UTHAR_ALPHA_POWERS,
        withoutTitus,
        WORKED_CONFIG
      )?.depth
    ).toBe(5)
  })

  it("estimates a unit as a team of five like it: 100,032 clears 6", () => {
    const estimate = unitClearEstimate(
      "ultraTigurius",
      UTHAR_ALPHA_POWERS,
      roster,
      WORKED_CONFIG
    )
    expect(
      5 * unitEffectivePower("ultraTigurius", roster, WORKED_CONFIG)!
    ).toBeCloseTo(100032, 6)
    expect(estimate).toMatchObject({ depth: 6, marginAbovePct: 10 })
    expect(
      unitClearEstimate(
        "ultraCalgar",
        UTHAR_ALPHA_POWERS,
        new Map(),
        WORKED_CONFIG
      )
    ).toBeNull()
  })

  it("uses an equipped relic's multiplier in place of the base one", () => {
    const relicConfig = {
      ...WORKED_CONFIG,
      hordeRelicMultipliers: new Map([
        ["ultraTigurius", new Map([["I_Crit_C001", 1.5]])],
      ]),
    }
    const equipped = new Map([
      [
        "ultraTigurius",
        {
          ...rosterUnit("ultraTigurius"),
          equippedItems: [
            { slotId: "slot1", equipmentId: "I_Crit_C001", level: 3 },
          ],
        } as ReturnType<typeof rosterUnit>,
      ],
    ])
    expect(unitEffectivePower("ultraTigurius", equipped, relicConfig)).toBe(
      16809 * 1.5
    )
    // Without the item: the base 1.2.
    expect(
      unitEffectivePower("ultraTigurius", roster, relicConfig)
    ).toBeCloseTo(
      unitPower("ultraTigurius", roster, relicConfig.unitPower)! * 1.2,
      6
    )
  })

  it("counts equipped items: Tigurius with I_Crit_C001 at level 3 is 16,809, still 6 with 11% above", () => {
    const equipped = new Map([
      [
        "ultraTigurius",
        {
          ...rosterUnit("ultraTigurius"),
          equippedItems: [
            { slotId: "slot1", equipmentId: "I_Crit_C001", level: 3 },
          ],
        } as ReturnType<typeof rosterUnit>,
      ],
    ])
    expect(unitPower("ultraTigurius", equipped, WORKED_CONFIG.unitPower)).toBe(
      16809
    )
    expect(
      5 * unitEffectivePower("ultraTigurius", equipped, WORKED_CONFIG)!
    ).toBeCloseTo(100854, 6)
    expect(
      unitClearEstimate(
        "ultraTigurius",
        UTHAR_ALPHA_POWERS,
        equipped,
        WORKED_CONFIG
      )
    ).toMatchObject({ depth: 6, marginAbovePct: 11 })
  })

  it("shows no estimate when power data is unavailable, never a partial sum", () => {
    expect(unitPower("ultraCalgar", roster, null)).toBeNull()
    expect(teamPower(WORKED_TEAM, roster, null)).toBeNull()
    expect(
      teamEffectivePower(WORKED_TEAM, roster, UNAVAILABLE_CONFIG)
    ).toBeNull()
    expect(
      teamClearEstimate(
        WORKED_TEAM,
        UTHAR_ALPHA_POWERS,
        roster,
        UNAVAILABLE_CONFIG
      )
    ).toBeNull()
    expect(
      unitClearEstimate(
        "ultraTigurius",
        UTHAR_ALPHA_POWERS,
        roster,
        UNAVAILABLE_CONFIG
      )
    ).toBeNull()

    // One member the power data does not know makes the whole team unavailable.
    const withUnknown = new Map(roster)
    withUnknown.set("unknownUnit", rosterUnit("unknownUnit"))
    const team = [...WORKED_TEAM.slice(0, 4), "unknownUnit"]
    expect(teamEffectivePower(team, withUnknown, WORKED_CONFIG)).toBeNull()
    expect(
      teamClearEstimate(team, UTHAR_ALPHA_POWERS, withUnknown, WORKED_CONFIG)
    ).toBeNull()
  })

  it("sums team power without horde-mode multipliers: 98,895", () => {
    expect(teamPower(WORKED_TEAM, roster, WORKED_CONFIG.unitPower)).toBe(98895)
  })

  it("is depth 0 with no margin above when battle 1 already fails", () => {
    expect(estimateClearDepth(965, UTHAR_ALPHA_POWERS, WORKED_CONFIG)).toEqual({
      depth: 0,
      sureDepth: 0,
      stretchDepth: 0,
      battleCount: 7,
      power: 965,
      marginAbovePct: null,
      shortfallToNextPct: 21,
      calibrated: true,
    })
  })

  it("has no shortfall when the last battle is cleared", () => {
    const estimate = estimateClearDepth(1000, [100, 200], WORKED_CONFIG)
    expect(estimate.depth).toBe(2)
    expect(estimate.marginAbovePct).toBe(317)
    expect(estimate.shortfallToNextPct).toBeNull()
  })

  it("defaults an untiered unit to multiplier 1.0", () => {
    expect(unitHordeMultiplier(WORKED_CONFIG, "ultraCalgar")).toBe(1)
    expect(unitHordeMultiplier(WORKED_CONFIG, "ultraTigurius")).toBe(1.2)
  })

  it("has no team estimate when no member is owned", () => {
    expect(
      teamClearEstimate(
        WORKED_TEAM,
        UTHAR_ALPHA_POWERS,
        new Map(),
        WORKED_CONFIG
      )
    ).toBeNull()
  })

  it("reads the tier list, a character's own multiplier overriding its tier's", () => {
    const config = clearEstimateConfig(
      {
        tiers: [
          { tier: "S", multiplier: 1.85 },
          { tier: "A", multiplier: 1.55 },
        ],
        characters: [
          { unitId: "ultraTigurius", tier: "A" },
          { unitId: "custoBladeChampion", tier: "S", multiplier: 2 },
          { unitId: "ultraCalgar", tier: "D" },
          { unitId: "bloodDante", tier: "D", multiplier: 1.4 },
        ],
      },
      WORKED_CONFIG.unitPower
    )
    expect(config.powerRatio).toBe(CLEAR_ESTIMATE_CURVE.likelyRatio)
    expect(config.calibrated).toBe(CLEAR_ESTIMATE_CALIBRATED)
    expect(unitHordeMultiplier(config, "ultraTigurius")).toBe(1.55)
    expect(unitHordeMultiplier(config, "custoBladeChampion")).toBe(2)
    // A tier the list does not define leaves the character untiered, unless it has its own value.
    expect(unitHordeMultiplier(config, "ultraCalgar")).toBe(1)
    expect(unitHordeMultiplier(config, "bloodDante")).toBe(1.4)
    // The tier names the picker shows: an undefined tier is no tier, even with its own value.
    expect(config.hordeTiers?.get("ultraTigurius")).toBe("A")
    expect(config.hordeTiers?.get("custoBladeChampion")).toBe("S")
    expect(config.hordeTiers?.has("ultraCalgar")).toBe(false)
    expect(config.hordeTiers?.has("bloodDante")).toBe(false)
    expect(estimateClearDepth(5000, [1000], config).calibrated).toBe(
      CLEAR_ESTIMATE_CALIBRATED
    )
  })

  it("treats every unit as untiered without a horde-mode tier list", () => {
    const config = clearEstimateConfig(null, WORKED_CONFIG.unitPower)
    expect(config.hordeMultipliers.size).toBe(0)
    expect(config.hordeTiers?.size).toBe(0)
    expect(config.unitPower).toBe(WORKED_CONFIG.unitPower)
    expect(clearEstimateConfig(null, null).unitPower).toBeNull()
  })

  it("prefers the manual depth over the estimate", () => {
    expect(teamEffectiveDepth(9, { depth: 6 })).toBe(9)
    expect(teamEffectiveDepth(null, { depth: 6 })).toBe(6)
    expect(teamEffectiveDepth(null, null)).toBeNull()
  })

  it("orders a lane's battle powers by its battle ids, null while one is missing", () => {
    const battles = [
      { id: "votanUthar-alpha-2", power: 3055 },
      { id: "votanUthar-alpha-1", power: 1018 },
    ]
    expect(
      laneBattlePowers(["votanUthar-alpha-1", "votanUthar-alpha-2"], battles)
    ).toEqual([1018, 3055])
    expect(
      laneBattlePowers(["votanUthar-alpha-1", "votanUthar-alpha-3"], battles)
    ).toBeNull()
  })
})

// Fabius Bile Alpha / Gamma battle powers (datamine `legendary_event_16_lane_{1,3}`).
const BILE_ALPHA_POWERS = [
  1184, 3728, 9902, 24711, 49842, 92887, 136056, 280510, 437871, 527461, 919925,
]
const BILE_GAMMA_POWERS = [
  1035, 3036, 8060, 20153, 40460, 75563, 135741, 225078, 350510,
]

describe("clear curve (fitted to reported clears)", () => {
  const config = clearEstimateConfig(null, null)

  it("needs r × (P / 100k)^0.25 × P: less than the power early, more late", () => {
    const curve = config.curve!
    expect(requiredClearPower(100_000, 1.2, curve)).toBeCloseTo(120_000, 6)
    expect(requiredClearPower(25_000, 1.2, curve)).toBeCloseTo(
      1.2 * Math.SQRT1_2 * 25_000,
      6
    )
    expect(requiredClearPower(400_000, 1.2, curve)).toBeCloseTo(
      1.2 * Math.SQRT2 * 400_000,
      6
    )
    expect(requiredClearPower(100_000, 1.2, undefined)).toBe(120_000)
  })

  // Each report: team power (horde multipliers at 1.0), lane, observed depth, expected bands.
  it.each([
    // #2: cleared 7, about half of 8.
    {
      power: 204_259,
      powers: BILE_ALPHA_POWERS,
      sure: 6,
      likely: 7,
      stretch: 7,
    },
    // #5 and #8: cleared 8, 9 out of reach.
    {
      power: 760_238,
      powers: BILE_ALPHA_POWERS,
      sure: 7,
      likely: 8,
      stretch: 10,
    },
    {
      power: 723_086,
      powers: BILE_ALPHA_POWERS,
      sure: 7,
      likely: 8,
      stretch: 10,
    },
    // #6: cleared 6, battle 7 partially.
    {
      power: 157_384,
      powers: BILE_GAMMA_POWERS,
      sure: 6,
      likely: 6,
      stretch: 7,
    },
    // #9: cleared 10, failed 11.
    {
      power: 978_492,
      powers: BILE_ALPHA_POWERS,
      sure: 8,
      likely: 10,
      stretch: 10,
    },
  ])(
    "puts a reported clear in its band: $power → $sure / $likely / $stretch",
    ({ power, powers, sure, likely, stretch }) => {
      const estimate = estimateClearDepth(power, powers, config)
      expect([
        estimate.sureDepth,
        estimate.depth,
        estimate.stretchDepth,
      ]).toEqual([sure, likely, stretch])
    }
  )

  it("orders the bands sure ≤ likely ≤ stretch", () => {
    for (const power of [5_000, 50_000, 150_000, 300_000, 2_000_000]) {
      const estimate = estimateClearDepth(power, BILE_ALPHA_POWERS, config)
      expect(estimate.sureDepth).toBeLessThanOrEqual(estimate.depth)
      expect(estimate.depth).toBeLessThanOrEqual(estimate.stretchDepth)
    }
  })
})
