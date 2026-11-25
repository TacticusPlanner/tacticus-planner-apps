import { characterIcon, npcPortrait } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

import type { NpcGroup } from "../model/types"

/**
 * The variation whose portrait stands for an NPC: `preferredId` (the selected or default variation)
 * when a portrait is mapped for it, else the first variation of the group that has one, else
 * `preferredId` (whose portrait falls back to the playable character's, then initials).
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

/**
 * The portrait URL for an NPC variation: its mapped portrait, else the round portrait of the playable
 * character the NPC is a version of, else `undefined` (the caller shows initials).
 */
export function npcPortraitSrc(
  variationId: string,
  characterId?: string | null
): string | undefined {
  return (
    npcPortrait(variationId) ??
    (characterId ? characterIcon(characterId as UnitId) : undefined)
  )
}
