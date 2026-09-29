export type PlanningSettings = {
  dailyEnergy: number
  /** Preferred XP-book rarity for level-up book figures; absent means Legendary. */
  xpBookRarity?: string
  revision: number
}

export const defaultPlanningSettings: PlanningSettings = {
  dailyEnergy: 288,
  revision: 0,
}

export const dailyEnergyTiers = [
  288, 378, 438, 538, 638, 738, 838, 938,
] as const
