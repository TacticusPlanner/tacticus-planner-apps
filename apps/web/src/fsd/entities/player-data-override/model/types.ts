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

export type OnslaughtAllianceProgress = {
  sector: OnslaughtSector
  tier: number
}

export type OnslaughtProgress = {
  imperial: OnslaughtAllianceProgress
  xenos: OnslaughtAllianceProgress
  chaos: OnslaughtAllianceProgress
  revision: number
}

export function progressForAlliance(
  progress: OnslaughtProgress,
  alliance: string
): OnslaughtAllianceProgress {
  const key = alliance.toLowerCase() as "imperial" | "xenos" | "chaos"
  return progress[key] ?? { sector: "Stone", tier: 1 }
}
