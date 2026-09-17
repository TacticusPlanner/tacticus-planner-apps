import type {
  BattleId,
  Rarity,
  UnitId,
  UpgradeId,
} from "@workspace/game-domain"

import type { DailyRaidBattleResource } from "./daily-raids.domain"
import { shardResourceLabel } from "./daily-raids.domain"

// Structural slices of the catalog records this builder reads — only the fields it actually needs,
// so both the mapped `UpgradeWithFarmLocations` domain shape and a raw catalog record satisfy them.
type BattleResourceUpgrade = {
  id: UpgradeId
  label: string
  rarity: Rarity
  crafted: boolean
  farmLocations: readonly { battleId: BattleId }[]
}

type BattleResourceCharacter = {
  id: UnitId
  name: string
  shardLocations: readonly { battleId: BattleId; isMythic: boolean }[]
}

/**
 * Catalog-wide "what does this node drop" index, keyed by `BattleId`.
 *
 * Today's Attempts is account-wide, so most of the nodes it lists are outside the current project's
 * plan and have no plan-derived resource to show an icon for (tacticus-planner-apps#121). The
 * catalog knows the answer regardless of any plan: a node is a farm location for exactly the
 * materials/shards whose own records point back at it, so inverting those pointers covers every
 * node the player can raid.
 *
 * A node's upgrade material wins over its shards: standing nodes drop one material each, while
 * shard drops are concentrated on the Elite tiers that the plan itself normally resolves anyway.
 * Ties between two materials on one node resolve by upgrade id so the icon never depends on dataset
 * ordering. Mythic shard locations are skipped — those are Onslaught/shop sources, not campaign
 * nodes (see `farmLocationSchema`'s `isMythic`).
 */
export function buildResourceByBattle(
  upgrades: Iterable<BattleResourceUpgrade>,
  characters: Iterable<BattleResourceCharacter>
): ReadonlyMap<BattleId, DailyRaidBattleResource> {
  const byBattle = new Map<BattleId, DailyRaidBattleResource>()
  const upgradeIdByBattle = new Map<BattleId, UpgradeId>()

  for (const upgrade of upgrades) {
    for (const location of upgrade.farmLocations) {
      const current = upgradeIdByBattle.get(location.battleId)
      if (current !== undefined && current <= upgrade.id) continue
      upgradeIdByBattle.set(location.battleId, upgrade.id)
      byBattle.set(location.battleId, {
        label: upgrade.label,
        visual: {
          kind: "upgrade",
          id: upgrade.id,
          rarity: upgrade.rarity,
          crafted: upgrade.crafted,
        },
      })
    }
  }

  for (const character of characters) {
    for (const location of character.shardLocations) {
      if (location.isMythic) continue
      if (byBattle.has(location.battleId)) continue
      byBattle.set(location.battleId, {
        label: shardResourceLabel(character.name),
        visual: { kind: "shard", unitId: character.id },
      })
    }
  }

  return byBattle
}
