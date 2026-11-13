import { describe, expect, it } from "vitest"

import {
  CLEAR_ESTIMATE_CALIBRATED,
  CLEAR_ESTIMATE_CURVE,
  battlePowerRatio,
  clearEstimateConfig,
  estimateClearDepth,
  laneBattlePowers,
  laneThresholdPowers,
  lockedMemberCount,
  memberPowers,
  requiredClearPower,
  teamClearEstimate,
  teamEffectiveDepth,
  teamEffectivePower,
  teamPower,
  unitClearEstimate,
  unitHordeMultiplier,
  unitEffectivePower,
  unitPower,
  teamBalanceFactor,
  topMemberShare,
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
      balanceFactor: 1,
      marginAbovePct: 12,
      shortfallToNextPct: 37,
      calibrated: true,
    })
  })

  it("multiplies a team's power by its team-balance factor when the config has one", () => {
    const config = {
      ...WORKED_CONFIG,
      teamBalance: { neutralShare: 0.4, slope: 1.3 },
    }
    const estimate = teamClearEstimate(
      WORKED_TEAM,
      UTHAR_ALPHA_POWERS,
      roster,
      config
    )
    // The strongest member (24,753) holds 25% of the members' 98,895 power.
    const factor = Math.exp(-1.3 * (24753 / 98895 - 0.4))
    expect(estimate?.balanceFactor).toBeCloseTo(factor, 9)
    expect(estimate?.power).toBeCloseTo(102229.4, 6)
    expect(estimate?.depth).toBe(
      estimateClearDepth(102229.4 * factor, UTHAR_ALPHA_POWERS, WORKED_CONFIG)
        .depth
    )
    expect(
      unitClearEstimate("ultraCalgar", UTHAR_ALPHA_POWERS, roster, config)
        ?.balanceFactor
    ).toBeCloseTo(Math.exp(0.26), 9)
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

  it("lists each member's power in member order, summing to the team power", () => {
    const powers = memberPowers(WORKED_TEAM, roster, WORKED_CONFIG.unitPower)
    expect(powers).toEqual([21675, 16672, 21883, 24753, 13912])
    expect(powers?.reduce((sum, power) => sum + power, 0)).toBe(98895)
    expect(memberPowers(WORKED_TEAM, roster, null)).toBeNull()
  })

  it("reads the curve ratio a power reaches on a battle", () => {
    // At the reference power the requirement is r × P, so power 2.2 × P reads exactly 2.2.
    const reference = CLEAR_ESTIMATE_CURVE.referencePower
    expect(battlePowerRatio(2.2 * reference, reference)).toBeCloseTo(2.2)
    expect(battlePowerRatio(100_000, 400_000)).toBeCloseTo(
      100_000 / requiredClearPower(400_000, 1, CLEAR_ESTIMATE_CURVE)
    )
  })

  it("is depth 0 with no margin above when battle 1 already fails", () => {
    expect(estimateClearDepth(965, UTHAR_ALPHA_POWERS, WORKED_CONFIG)).toEqual({
      depth: 0,
      sureDepth: 0,
      stretchDepth: 0,
      battleCount: 7,
      power: 965,
      balanceFactor: 1,
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

  it("scales a lane's battle powers by its enemies' NPC multipliers (count-weighted without power data)", () => {
    const battles = [
      {
        id: "b-2",
        power: 2000,
        waves: [
          {
            enemies: [
              { id: "grunt", ladderIndex: 1, count: 3 },
              { id: "heavy", ladderIndex: 1, count: 1 },
            ],
          },
        ],
      },
      {
        id: "b-1",
        power: 1000,
        waves: [{ enemies: [{ id: "grunt", ladderIndex: 1, count: 4 }] }],
      },
    ]
    const config = { unitPower: null, npcMultipliers: new Map([["heavy", 2]]) }
    // b-2: 3 grunts at 1.0 and 1 heavy at 2.0 → 1.25 × 2000.
    expect(laneThresholdPowers(["b-1", "b-2"], battles, config)).toEqual([
      1000, 2500,
    ])
    expect(
      laneThresholdPowers(["b-1", "b-2"], battles, { unitPower: null })
    ).toEqual([1000, 2000])
    expect(laneThresholdPowers(["b-1", "b-3"], battles, config)).toBeNull()
  })
})

// Fabius Bile Alpha / Gamma battle powers (datamine `legendary_event_16_lane_{1,3}`).
const BILE_ALPHA_POWERS = [
  1184, 3728, 9902, 24711, 49842, 92887, 136056, 280510, 437871, 527461, 919925,
  1242564, 1826995, 3119051, 6254801, 10199192,
]
const BILE_GAMMA_POWERS = [
  1035, 3036, 8060, 20153, 40460, 75563, 135741, 225078, 350510, 526488, 754219,
  1009586, 1499878, 2506501, 5002344, 10046258,
]

describe("clear curve (fitted to battle results)", () => {
  const config = clearEstimateConfig(null, null)

  it("needs r × (P / 100k)^-0.1 × P: a little more than the power early, a little less late", () => {
    const curve = config.curve!
    expect(requiredClearPower(100_000, 1.2, curve)).toBeCloseTo(120_000, 6)
    expect(requiredClearPower(25_000, 1.2, curve)).toBeCloseTo(
      1.2 * 4 ** 0.1 * 25_000,
      6
    )
    expect(requiredClearPower(400_000, 1.2, curve)).toBeCloseTo(
      1.2 * 4 ** -0.1 * 400_000,
      6
    )
    expect(requiredClearPower(100_000, 1.2, undefined)).toBe(120_000)
  })

  // Each Discord report: team power (horde multipliers at 1.0), lane, the top member's share read off
  // the members' levels, and the bands with the team-balance factor. Every reported depth lands in
  // its band (#2 cleared 7, #5 and #8 cleared 8, #6 cleared 6, #9 cleared 10, #36 and #38 cleared 15).
  it.each([
    {
      report: 2,
      power: 204_259,
      powers: BILE_ALPHA_POWERS,
      share: 0.6,
      bands: [5, 6, 7],
    },
    {
      report: 5,
      power: 760_238,
      powers: BILE_ALPHA_POWERS,
      share: 0.65,
      bands: [7, 9, 10],
    },
    {
      report: 8,
      power: 723_086,
      powers: BILE_ALPHA_POWERS,
      share: 0.6,
      bands: [7, 9, 10],
    },
    {
      report: 6,
      power: 157_384,
      powers: BILE_GAMMA_POWERS,
      share: 0.55,
      bands: [5, 6, 7],
    },
    {
      report: 9,
      power: 978_492,
      powers: BILE_ALPHA_POWERS,
      share: 0.5,
      bands: [8, 10, 12],
    },
    {
      report: 36,
      power: 3_163_371,
      powers: BILE_ALPHA_POWERS,
      share: 0.22,
      bands: [13, 14, 15],
    },
    {
      report: 38,
      power: 3_557_982,
      powers: BILE_GAMMA_POWERS,
      share: 0.22,
      bands: [14, 14, 15],
    },
  ])(
    "puts report #$report in its band: $bands",
    ({ power, powers, share, bands }) => {
      const factor = teamBalanceFactor(share, config.teamBalance)
      const estimate = estimateClearDepth(power, powers, config, factor)
      expect([
        estimate.sureDepth,
        estimate.depth,
        estimate.stretchDepth,
      ]).toEqual(bands)
    }
  )

  it("scales power by the team-balance factor: ×1 at a 0.4 share, more balanced reads deeper", () => {
    expect(teamBalanceFactor(0.4, config.teamBalance)).toBeCloseTo(1, 9)
    expect(teamBalanceFactor(0.2, config.teamBalance)).toBeCloseTo(
      Math.exp(0.26),
      9
    )
    expect(teamBalanceFactor(0.9, config.teamBalance)).toBeCloseTo(
      Math.exp(-0.65),
      9
    )
    expect(teamBalanceFactor(null, config.teamBalance)).toBe(1)
    expect(teamBalanceFactor(0.9, undefined)).toBe(1)
    expect(topMemberShare([30, 10, 10])).toBeCloseTo(0.6, 9)
    expect(topMemberShare([0, 0])).toBeNull()
  })

  it("keeps the effective power and reports the factor it applied", () => {
    const estimate = estimateClearDepth(500_000, BILE_ALPHA_POWERS, config, 0.5)
    expect(estimate.power).toBe(500_000)
    expect(estimate.balanceFactor).toBe(0.5)
    expect(estimate.depth).toBe(
      estimateClearDepth(250_000, BILE_ALPHA_POWERS, config).depth
    )
  })

  it("orders the bands sure ≤ likely ≤ stretch", () => {
    for (const power of [5_000, 50_000, 150_000, 300_000, 2_000_000]) {
      const estimate = estimateClearDepth(power, BILE_ALPHA_POWERS, config)
      expect(estimate.sureDepth).toBeLessThanOrEqual(estimate.depth)
      expect(estimate.depth).toBeLessThanOrEqual(estimate.stretchDepth)
    }
  })
})
