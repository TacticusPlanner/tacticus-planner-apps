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
  /** 1–3 is the tier currently being farmed; 4 means the sector is complete (pays tier-3 rewards). */
  tier: OnslaughtTier
  /** False when the player never saved this alliance; `sector`/`tier` are then a Stone 1
   *  placeholder and must not be used as real progress. */
  isSet: boolean
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

/** The alliance's saved position, or `undefined` when the player has not set it — callers treat an
 *  unset alliance as "Onslaught supplies nothing" instead of falling back to Stone 1. */
export function progressForAlliance(
  progress: OnslaughtProgress,
  alliance: string
): OnslaughtAllianceProgress | undefined {
  const key = alliance.toLowerCase() as "imperial" | "xenos" | "chaos"
  const value = progress[key] as OnslaughtAllianceProgress | undefined
  return value?.isSet ? value : undefined
}
