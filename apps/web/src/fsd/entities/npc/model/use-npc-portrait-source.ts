import { useCatalogDataset } from "@/shared/local-data"

import { buildNpcPortraitIndex } from "../lib/portrait-variation"
import type { NpcPortraitSource } from "../lib/portrait-variation"

/**
 * A variation's portrait source from the served `npcs` (see `buildNpcPortraitIndex`), so every NPC
 * portrait in the app resolves like the NPC library; undefined while the NPCs load or for an id they lack.
 */
export function useNpcPortraitSource(
  variationId: string
): NpcPortraitSource | undefined {
  const index = useCatalogDataset("npcs", buildNpcPortraitIndex)
  return index.status === "ready" ? index.data.get(variationId) : undefined
}
