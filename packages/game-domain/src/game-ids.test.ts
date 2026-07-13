import { describe, expect, expectTypeOf, it } from "vitest"

import {
  abilityIdSchema,
  battleIdSchema,
  campaignIdSchema,
  equipmentIdSchema,
  factionIdSchema,
  unitIdSchema,
  upgradeIdSchema,
  type BattleId,
  type CampaignId,
  type FactionId,
  type UnitId,
} from "./game-ids"

const schemas = [
  unitIdSchema,
  campaignIdSchema,
  upgradeIdSchema,
  equipmentIdSchema,
  abilityIdSchema,
  factionIdSchema,
  battleIdSchema,
]

describe("game ID schemas", () => {
  it.each(schemas)("accepts strings, including the empty string", (schema) => {
    expect(schema.parse("game-id")).toBe("game-id")
    expect(schema.parse("")).toBe("")
  })

  it.each(schemas)("rejects non-string values", (schema) => {
    expect(schema.safeParse(42).success).toBe(false)
    expect(schema.safeParse(null).success).toBe(false)
  })

  it("keeps brands mutually incompatible", () => {
    const unitId = unitIdSchema.parse("unit")
    const campaignId = campaignIdSchema.parse("campaign")
    const battleId = battleIdSchema.parse("battle")
    const factionId = factionIdSchema.parse("faction")

    expectTypeOf(unitId).toEqualTypeOf<UnitId>()
    expectTypeOf(campaignId).toEqualTypeOf<CampaignId>()
    expectTypeOf(battleId).toEqualTypeOf<BattleId>()
    expectTypeOf(factionId).toEqualTypeOf<FactionId>()
    expectTypeOf(unitId).not.toEqualTypeOf<CampaignId>()
    expectTypeOf(battleId).not.toEqualTypeOf<FactionId>()

    const acceptsUnitId = (value: UnitId) => value
    acceptsUnitId(unitId)
    // @ts-expect-error A campaign ID cannot be passed where a unit ID is required.
    acceptsUnitId(campaignId)
    // @ts-expect-error A battle ID cannot be passed where a unit ID is required.
    acceptsUnitId(battleId)
    // @ts-expect-error Plain strings must be parsed before entering branded APIs.
    acceptsUnitId("unit")

    const acceptsBattleId = (value: BattleId) => value
    acceptsBattleId(battleId)
    // @ts-expect-error A faction ID cannot be passed where a battle ID is required.
    acceptsBattleId(factionId)
    // @ts-expect-error Plain strings must be parsed before entering branded APIs.
    acceptsBattleId("battle")
  })
})
