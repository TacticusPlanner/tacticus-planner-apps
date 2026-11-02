import { datamineAssetUrl } from "@workspace/game-catalog"

/**
 * The game's campaign medal, one per star earned on a battle. Kept here rather than imported from
 * the daily-raids feature, whose barrel pulls in far more than this page needs.
 */
export const medalIcon = datamineAssetUrl("atlases/ui_campaign_medal.webp")
