export type PlanningSettings = {
  dailyEnergy: number
  revision: number
}

export const defaultPlanningSettings: PlanningSettings = {
  dailyEnergy: 288,
  revision: 0,
}

export const dailyEnergyTiers = [
  288, 378, 438, 538, 638, 738, 838, 938,
] as const
