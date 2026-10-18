import { z } from "zod"

const percentSchema = z.number().int().nonnegative()

// The game's power tables (unit-power dataset): a single record. Every modifier is a percentage; a
// trait or ability absent from its list counts as 100. `units` has one entry per catalog character
// and MoW: `rankUpStatIncreases[rank][slot]` is the stat increase of the character's `rankUpUpgrades`
// upgrade at the same rank and slot (empty for a MoW). The client computes power from these plus the
// unit, equipment and upgrade datasets (`@workspace/game-domain` `unit-power`).
export const unitPowerSchema = z.looseObject({
  id: z.string(),
  heroProgressionSteps: z.array(
    z.looseObject({
      step: z.number().int(),
      unitStatMultiplierPct: z.number().int().positive(),
      abilityPowerMultiplier: z.number().int().positive(),
    })
  ),
  mowProgressionSteps: z.array(
    z.looseObject({
      step: z.number().int(),
      abilityPowerMultiplier: z.number().int().positive(),
      mythicAbilityPower: z.number().int().nonnegative(),
    })
  ),
  damageProfileModifiers: z.array(
    z.looseObject({ damageType: z.string(), modifier: percentSchema })
  ),
  traitPowerModifiers: z.array(
    z.looseObject({ traitId: z.string(), modifier: percentSchema })
  ),
  abilityPowerModifiers: z.array(
    z.looseObject({ abilityId: z.string(), modifier: percentSchema })
  ),
  abilityPowerCurves: z.looseObject({
    active: z.array(z.number().nonnegative()),
    passive: z.array(z.number().nonnegative()),
    relic: z.array(z.number().nonnegative()),
  }),
  units: z.array(
    z.looseObject({
      unitId: z.string(),
      powerMultiplier: percentSchema,
      rankUpStatIncreases: z.array(z.array(z.number().int().nonnegative())),
    })
  ),
})
