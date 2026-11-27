import { characterIcon, npcPortrait } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

import type { NpcGroup, NpcRecord } from "../model/types"
import { buildNpcGroups } from "./build-npc-groups"

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

/** Where a variation's portrait comes from: the variation to show and the playable character behind it. */
export interface NpcPortraitSource {
  variationId: string
  characterId: string | null
}

/**
 * Each served variation's portrait source, resolved as the NPC library resolves it: a variation without
 * a mapped portrait borrows one from another variation of its NPC (same catalog name, as
 * `buildNpcGroups` groups them, e.g. an event-only `…Surv` boss), then the NPC's playable character.
 */
export function buildNpcPortraitIndex(
  records: readonly NpcRecord[]
): ReadonlyMap<string, NpcPortraitSource> {
  const index = new Map<string, NpcPortraitSource>()
  for (const record of records) {
    index.set(record.id, {
      variationId: record.id,
      characterId: record.characterId ?? null,
    })
  }
  for (const group of buildNpcGroups(records)) {
    for (const variation of group.variations) {
      index.set(variation.id, {
        variationId: portraitVariationOf(group, variation.id),
        characterId: variation.characterId ?? group.characterId,
      })
    }
  }
  return index
}
