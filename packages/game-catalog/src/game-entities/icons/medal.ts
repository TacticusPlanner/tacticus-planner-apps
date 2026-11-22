import { datamineAssetUrl } from "./asset-path"

/** The game's campaign medal, one per star earned on a battle. */
export function medalIcon(): string {
  return datamineAssetUrl("atlases/ui_campaign_medal.webp")
}

export type MilestoneMedal = "Bronze" | "Silver" | "Gold"

/** A campaign-event milestone medal. */
export function milestoneMedalIcon(medal: MilestoneMedal): string {
  return datamineAssetUrl(`fonts/${medal}_Medal.webp`)
}
