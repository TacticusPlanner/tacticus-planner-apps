export const onslaughtAlliances = ["Imperial", "Xenos", "Chaos"] as const
export const onslaughtSectors = [
  "Stone",
  "Iron",
  "Bronze",
  "Silver",
  "Gold",
  "Diamond",
  "Adamantine",
] as const

export type OnslaughtAlliance = (typeof onslaughtAlliances)[number]
export type OnslaughtSector = (typeof onslaughtSectors)[number]
export const onslaughtTiers = [1, 2, 3, 4] as const
export type OnslaughtTier = (typeof onslaughtTiers)[number]

export type OnslaughtAllianceProgress = {
  sector: OnslaughtSector
  tier: OnslaughtTier
}

export type OnslaughtProgress = {
  imperial: OnslaughtAllianceProgress
  xenos: OnslaughtAllianceProgress
  chaos: OnslaughtAllianceProgress
  revision: number
}

export type CampaignEventProgressOverride = {
  campaignGroupId: string
  type: "Standard" | "Extremis"
  completedBattleCount: number | null
  completedChallengeBattlesIds: string[] | null
}

export type CampaignEventProgressOverrides = {
  progress: CampaignEventProgressOverride[]
  revision: number
}

export function progressForAlliance(
  progress: OnslaughtProgress,
  alliance: string
): OnslaughtAllianceProgress {
  const key = alliance.toLowerCase() as "imperial" | "xenos" | "chaos"
  return progress[key] ?? { sector: "Stone", tier: 1 }
}
