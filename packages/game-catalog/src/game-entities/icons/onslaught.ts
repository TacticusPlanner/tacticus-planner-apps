import { ASSET_BASE_PATH } from "./asset-path"

export type OnslaughtSectorIcon =
  "Stone" | "Iron" | "Bronze" | "Silver" | "Gold" | "Diamond" | "Adamantine"
export type OnslaughtTierIcon = 1 | 2 | 3 | 4
export type OnslaughtAllianceIcon = "Imperial" | "Xenos" | "Chaos"

export function onslaughtTierIcon(
  sector: OnslaughtSectorIcon,
  tier: OnslaughtTierIcon
): string {
  return `${ASSET_BASE_PATH}/onslaught/ui_onslaught_button_rank_${sector.toLowerCase()}_${tier}.png`
}

export function onslaughtAllianceIcon(alliance: OnslaughtAllianceIcon): string {
  return `${ASSET_BASE_PATH}/onslaught/${alliance.toLowerCase()}.png`
}
