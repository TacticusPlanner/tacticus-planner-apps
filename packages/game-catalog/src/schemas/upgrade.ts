import { z } from "zod"

import { farmLocationSchema } from "./shared"

// A recipe ingredient. Craftable ingredients carry their own nested recipe (recursively); base materials
// have no nested recipe. Typed explicitly because the schema is self-referential.
export type GameCatalogUpgradeRecipeIngredient = {
  material: string
  count: number
  recipe: GameCatalogUpgradeRecipeIngredient[] | null
}

const upgradeRecipeIngredientSchema: z.ZodType<GameCatalogUpgradeRecipeIngredient> =
  z.lazy(() =>
    z.looseObject({
      material: z.string(),
      count: z.number(),
      recipe: z.array(upgradeRecipeIngredientSchema).nullable(),
    })
  )

export const upgradeViewSchema = z.looseObject({
  id: z.string(),
  material: z.string(),
  snowprintId: z.string(),
  label: z.string(),
  rarity: z.string(),
  stat: z.string(),
  craftable: z.boolean(),
  recipe: z.array(upgradeRecipeIngredientSchema),
  farmLocations: z.array(farmLocationSchema),
})
