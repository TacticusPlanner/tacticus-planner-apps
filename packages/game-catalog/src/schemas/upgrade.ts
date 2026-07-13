import { z } from "zod"
import { Rarity, upgradeIdSchema, type UpgradeId } from "@workspace/game-domain"
import { farmLocationSchema } from "./shared"

// A recipe ingredient. Craftable ingredients carry their own nested recipe (recursively); base materials
// have no nested recipe. Typed explicitly because the schema is self-referential.
export type GameCatalogUpgradeRecipeIngredient = {
  material: UpgradeId
  count: number
  recipe: GameCatalogUpgradeRecipeIngredient[] | null
}

const upgradeRecipeIngredientSchema: z.ZodType<GameCatalogUpgradeRecipeIngredient> =
  z.lazy(() =>
    z.looseObject({
      material: upgradeIdSchema,
      count: z.number(),
      recipe: z.array(upgradeRecipeIngredientSchema).nullable(),
    })
  )

export const upgradeViewSchema = z.looseObject({
  id: upgradeIdSchema,
  material: upgradeIdSchema,
  snowprintId: z.string(),
  label: z.string(),
  rarity: z.enum(Rarity),
  stat: z.string(),
  craftable: z.boolean(),
  recipe: z.array(upgradeRecipeIngredientSchema),
  farmLocations: z.array(farmLocationSchema),
})
