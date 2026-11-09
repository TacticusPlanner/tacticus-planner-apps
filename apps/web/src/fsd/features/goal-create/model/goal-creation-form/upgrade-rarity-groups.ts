import { rarityRank, type Rarity, type UpgradeId } from "@workspace/game-domain"

export type UpgradeRarityGroup = {
  rarity: Rarity
  /** The not-yet-picked materials of this rarity the range needs, with how many. */
  upgrades: { upgradeId: UpgradeId; quantity: number }[]
}

/**
 * The range's still-unpicked materials grouped by rarity, lowest rarity first, so one press adds
 * "every Legendary material from here to D3" at the quantities the range needs. Materialized: the
 * goal stores the materials themselves, not the rarity.
 */
export function upgradeRarityGroups(
  choices: ReadonlyMap<UpgradeId, number>,
  picked: readonly { upgradeId: string }[],
  rarityOf: (id: UpgradeId) => Rarity | undefined
): UpgradeRarityGroup[] {
  const pickedIds = new Set(picked.map((target) => target.upgradeId))
  const groups = new Map<Rarity, UpgradeRarityGroup>()
  for (const [upgradeId, quantity] of choices) {
    const rarity = rarityOf(upgradeId)
    if (!rarity || pickedIds.has(upgradeId) || quantity <= 0) continue
    const group = groups.get(rarity) ?? { rarity, upgrades: [] }
    group.upgrades.push({ upgradeId, quantity })
    groups.set(rarity, group)
  }
  return [...groups.values()].sort(
    (a, b) => rarityRank(a.rarity) - rarityRank(b.rarity)
  )
}
