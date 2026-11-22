import {
  battleGlyphIcon,
  medalIcon as campaignMedalIcon,
  milestoneMedalIcon,
} from "@workspace/game-catalog"

import type { BattleMilestone } from "../model/battle-progress"

/** The game's campaign medal (one per star earned on a battle). */
export const medalIcon = campaignMedalIcon()

/** The game's Lightning Victory laurel. */
export const lightningVictoryIcon = battleGlyphIcon("lightningVictory")

/** The game's campaign-event milestone medals. */
export const milestoneIcons: Record<BattleMilestone, string> = {
  Bronze: milestoneMedalIcon("Bronze"),
  Silver: milestoneMedalIcon("Silver"),
  Gold: milestoneMedalIcon("Gold"),
}
