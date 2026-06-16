export type UpgradeRarity = "common" | "rare" | "epic"

export type Upgrade = {
  id: string
  label: string
  rarity: UpgradeRarity
  craftable: boolean
}

export const baseUpgradeSamples: Upgrade[] = [
  {
    id: "adamantium-ore",
    label: "Adamantium Ore",
    rarity: "common",
    craftable: false,
  },
  {
    id: "purity-seal",
    label: "Purity Seal",
    rarity: "rare",
    craftable: true,
  },
]

export function getUpgradeById(upgradeId: string) {
  return baseUpgradeSamples.find((upgrade) => upgrade.id === upgradeId)
}
