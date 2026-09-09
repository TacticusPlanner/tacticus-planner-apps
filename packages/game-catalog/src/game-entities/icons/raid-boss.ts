import type { UnitId } from "@workspace/game-domain"

import {
  fieldNpcPortraitOverrides,
  raidBossPrefixPortraitOverrides,
  raidBossRoundPortraitOverrides,
} from "../raid-boss-portrait-overrides"
import { ASSET_BASE_PATH } from "./asset-path"
import { characterIcon } from "./character"

const characterAsset = (file: string): string =>
  `${ASSET_BASE_PATH}/characters/${file}`

/**
 * Full (non-round) splash portrait for a boss, resolved from its `GuildBoss{N}` prefix. Ported now for
 * completeness; the detail-header wiring is a deferred follow-up (`tacticus-planner-apps#122`).
 */
export function raidBossSplashPortrait(unitSetId: string): string | undefined {
  const prefix = /^(GuildBoss\d+)/.exec(unitSetId)?.[1]
  const file = prefix ? raidBossPrefixPortraitOverrides[prefix] : undefined
  return file ? characterAsset(file) : undefined
}

/**
 * Round-portrait URL for a raid boss / prime, resolved entirely from its `unitSetId`:
 * the ported override map first, then — for a prime that is also a playable character — the roster
 * portrait via its resolved character id, else `undefined` (the caller renders a text badge).
 */
export function raidBossPortrait(
  unitSetId: string,
  rosterCharacterId?: string
): string | undefined {
  const override = raidBossRoundPortraitOverrides[unitSetId]
  if (override) return characterAsset(override)
  if (rosterCharacterId) return characterIcon(rosterCharacterId as UnitId)
  return undefined
}

/**
 * Round-portrait URL for a field npc, resolved from its encounter `id` and the owning unit set's
 * `questUnitId`: the ported npc override map first, then the npc/character portrait for `questUnitId`,
 * else `undefined`.
 */
export function fieldNpcIcon(ref: {
  id: string
  questUnitId?: string
}): string | undefined {
  const override = fieldNpcPortraitOverrides[ref.id]
  if (override) return characterAsset(override)
  if (ref.questUnitId) return characterIcon(ref.questUnitId as UnitId)
  return undefined
}
