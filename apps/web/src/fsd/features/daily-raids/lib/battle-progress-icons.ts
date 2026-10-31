import { datamineAssetUrl } from "@workspace/game-catalog"

import type { BattleMilestone } from "../model/battle-progress"

/** The game's campaign medal (one per star earned on a battle). */
export const medalIcon = datamineAssetUrl("atlases/ui_campaign_medal.webp")

/** The game's Lightning Victory laurel. */
export const lightningVictoryIcon = datamineAssetUrl(
  "atlases/ui_icon_lightning_victory.webp"
)

/** The game's campaign-event milestone medals. */
export const milestoneIcons: Record<BattleMilestone, string> = {
  Bronze: datamineAssetUrl("fonts/Bronze_Medal.webp"),
  Silver: datamineAssetUrl("fonts/Silver_Medal.webp"),
  Gold: datamineAssetUrl("fonts/Gold_Medal.webp"),
}
