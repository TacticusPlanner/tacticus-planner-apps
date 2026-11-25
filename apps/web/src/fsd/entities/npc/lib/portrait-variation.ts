import { npcPortrait } from "@workspace/game-catalog"

import type { NpcGroup } from "../model/types"

/**
 * The variation whose portrait stands for an NPC: `preferredId` (the selected or default variation)
 * when a portrait is mapped for it, else the first variation of the group that has one, else
 * `preferredId` (whose portrait falls back to initials).
 */
export function portraitVariationOf(
  group: Pick<NpcGroup, "defaultVariationId" | "variations">,
  preferredId: string = group.defaultVariationId
): string {
  if (npcPortrait(preferredId)) return preferredId
  return (
    group.variations.find((variation) => npcPortrait(variation.id))?.id ??
    preferredId
  )
}
