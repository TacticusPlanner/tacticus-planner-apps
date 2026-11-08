import type { BattleId, UnitId, UpgradeId } from "@workspace/game-domain"

import {
  mythicShardResourceId,
  shardResourceId,
} from "@/features/goal-farming/@x/daily-raids"
import type { ResourceShopSource, ResourceSources } from "./daily-raids.domain"
import type { PlanCell } from "./plan-day-cells"

type FarmableUpgrade = {
  id: UpgradeId
  farmLocations: readonly { battleId: BattleId }[]
}

type FarmableCharacter = {
  id: UnitId
  shardLocations: readonly { battleId: BattleId; isMythic: boolean }[]
}

type ShopVariant = {
  reward: { type: string; qty: number }
  unitId?: string
  cost: { currency: string; amount: number }
}

type CatalogShop = {
  id: string
  slots: readonly { variants: readonly ShopVariant[] }[]
}

/** A campaign node that drops a plan cell's resource but that the cell's day does not raid. */
export type PlanCellAlternative = {
  battleId: BattleId
  /** Not raidable for the plan right now: the campaign isn't unlocked or progressed far enough, the
   *  campaign event isn't running or reached, or a filter excludes it — so the engine could not
   *  pick it. */
  locked: boolean
}

/** A plan cell's other sources, grouped the way the Schedule tooltip lists them. */
export type PlanCellAlternatives = {
  campaigns: PlanCellAlternative[]
  events: PlanCellAlternative[]
  shops: readonly ResourceShopSource[]
}

/** The plan resource id a shop reward type feeds, as `projectShopSupply` resolves it. */
function shopRewardResourceId(rewardType: string): string {
  if (rewardType.startsWith("mythicShards_"))
    return mythicShardResourceId(rewardType.slice("mythicShards_".length))
  if (rewardType.startsWith("shards_"))
    return shardResourceId(rewardType.slice("shards_".length))
  return rewardType
}

/**
 * Every catalog source per plan resource id, independent of the plan — the full list the Schedule
 * tooltip draws a cell's alternatives from. Campaign nodes come from upgrades' `farmLocations` and
 * characters' `shardLocations` (mythic ones feed `mythic-shard:<unit>`); a node the battle catalog
 * doesn't know is dropped, and one listed twice (guaranteed + potential drops) appears once. Shops
 * come from every slot variant whose reward is the resource, keeping each shop's cheapest price per
 * item.
 */
export function buildResourceSources({
  upgrades,
  characters,
  shops,
  knownBattleIds,
}: {
  upgrades: Iterable<FarmableUpgrade>
  characters: Iterable<FarmableCharacter>
  shops: readonly CatalogShop[]
  knownBattleIds: ReadonlySet<BattleId>
}): ReadonlyMap<string, ResourceSources> {
  const battlesByResource = new Map<string, Set<BattleId>>()
  const addBattle = (resourceId: string, battleId: BattleId) => {
    if (!knownBattleIds.has(battleId)) return
    const battles = battlesByResource.get(resourceId) ?? new Set<BattleId>()
    battles.add(battleId)
    battlesByResource.set(resourceId, battles)
  }
  for (const upgrade of upgrades) {
    for (const location of upgrade.farmLocations)
      addBattle(upgrade.id, location.battleId)
  }
  for (const character of characters) {
    for (const location of character.shardLocations) {
      addBattle(
        location.isMythic
          ? mythicShardResourceId(character.id)
          : shardResourceId(character.id),
        location.battleId
      )
    }
  }

  const shopsByResource = new Map<string, Map<string, ResourceShopSource>>()
  for (const shop of shops) {
    for (const slot of shop.slots) {
      for (const variant of slot.variants) {
        const resourceId = shopRewardResourceId(variant.reward.type)
        const byShop =
          shopsByResource.get(resourceId) ??
          new Map<string, ResourceShopSource>()
        const current = byShop.get(shop.id)
        const perItem = variant.cost.amount / variant.reward.qty
        if (current && current.cost / current.rewardQty <= perItem) continue
        byShop.set(shop.id, {
          shopId: shop.id,
          rewardQty: variant.reward.qty,
          currency: variant.cost.currency,
          cost: variant.cost.amount,
        })
        shopsByResource.set(resourceId, byShop)
      }
    }
  }

  const sources = new Map<string, ResourceSources>()
  for (const resourceId of new Set([
    ...battlesByResource.keys(),
    ...shopsByResource.keys(),
  ])) {
    sources.set(resourceId, {
      battleIds: [...(battlesByResource.get(resourceId) ?? [])],
      shops: [...(shopsByResource.get(resourceId)?.values() ?? [])],
    })
  }
  return sources
}

const byLock = (alternatives: PlanCellAlternative[]) => [
  ...alternatives.filter((alternative) => !alternative.locked),
  ...alternatives.filter((alternative) => alternative.locked),
]

/**
 * The other sources of a plan cell's resource (feature request "Show alternative retrieval campaigns
 * for upgrades"): every catalog campaign node the day doesn't already raid for it, split into
 * standing campaigns and campaign events — within each, the nodes the plan could raid first, then
 * the locked ones, catalog order otherwise — plus every shop that sells it.
 */
export function planCellAlternatives(
  cell: Pick<PlanCell, "resourceId" | "nodes">,
  sourcesByResource: ReadonlyMap<string, ResourceSources>,
  eligibleBattleIds: ReadonlySet<BattleId>,
  isEventBattle: (battleId: BattleId) => boolean
): PlanCellAlternatives {
  const sources = sourcesByResource.get(cell.resourceId)
  const planned = new Set(cell.nodes.map((node) => node.battleId))
  const campaigns: PlanCellAlternative[] = []
  const events: PlanCellAlternative[] = []
  for (const battleId of sources?.battleIds ?? []) {
    if (planned.has(battleId)) continue
    const alternative = { battleId, locked: !eligibleBattleIds.has(battleId) }
    ;(isEventBattle(battleId) ? events : campaigns).push(alternative)
  }
  return {
    campaigns: byLock(campaigns),
    events: byLock(events),
    shops: sources?.shops ?? [],
  }
}
