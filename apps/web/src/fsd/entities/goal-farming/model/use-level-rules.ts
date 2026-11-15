import { useCatalogDataset } from "@/shared/local-data"

import { toLevelRules, type LevelRules } from "../lib/level-rules"

/** The game's XP and rank-up level rules; undefined until `progression-rules` has loaded. */
export function useLevelRules(): LevelRules | undefined {
  const read = useCatalogDataset("progression-rules", toLevelRules)
  return read.status === "ready" ? read.data : undefined
}
