// The HRE reward rules the game data has no source for (the wiki's "New Character Events" page,
// oldid 31077). The milestones, leaderboard brackets, chests, mission currency and step shards come
// from the served `hre` and `progression-rules` datasets (`hre-rules.ts`).

export type HreRarityStepId =
  | "common-0"
  | "common-1"
  | "common-2"
  | "uncommon-2"
  | "uncommon-3"
  | "uncommon-4"
  | "rare-4"
  | "rare-5"
  | "rare-red-1"
  | "epic-red-1"
  | "epic-red-2"
  | "epic-red-3"
  | "legendary-red-3"
  | "legendary-red-4"
  | "legendary-red-5"
  | "legendary-blue-1"

/** The pace's rarity steps, from a Common unlock up to Legendary blue star, by the game's progression
 *  step they reach (whose `hreShards` are that step's event shards). */
export const HRE_RARITY_STEP_IDS: readonly {
  id: HreRarityStepId
  progression: string
  /** The unlock step of a hero of this starting rarity. */
  unlockFor?: "Common" | "Uncommon" | "Rare"
}[] = [
  { id: "common-0", progression: "Common:None", unlockFor: "Common" },
  { id: "common-1", progression: "Common:OneStar" },
  { id: "common-2", progression: "Common:TwoStars" },
  {
    id: "uncommon-2",
    progression: "Uncommon:TwoStars",
    unlockFor: "Uncommon",
  },
  { id: "uncommon-3", progression: "Uncommon:ThreeStars" },
  { id: "uncommon-4", progression: "Uncommon:FourStars" },
  { id: "rare-4", progression: "Rare:FourStars", unlockFor: "Rare" },
  { id: "rare-5", progression: "Rare:FiveStars" },
  { id: "rare-red-1", progression: "Rare:RedOneStar" },
  { id: "epic-red-1", progression: "Epic:RedOneStar" },
  { id: "epic-red-2", progression: "Epic:RedTwoStars" },
  { id: "epic-red-3", progression: "Epic:RedThreeStars" },
  { id: "legendary-red-3", progression: "Legendary:RedThreeStars" },
  { id: "legendary-red-4", progression: "Legendary:RedFourStars" },
  { id: "legendary-red-5", progression: "Legendary:RedFiveStars" },
  { id: "legendary-blue-1", progression: "Legendary:OneBlueStar" },
]

/** Daily payouts arrive on days 2 to 15. */
/** The game progression (rarity and stars) a pace step reaches, for drawing it. */
export function hreStepProgression(id: HreRarityStepId): string | undefined {
  return HRE_RARITY_STEP_IDS.find((step) => step.id === id)?.progression
}

export const HRE_DAILY_PAYOUTS = 14
/** The "Oh So Close" offer covers a gap of this many shards or fewer. */
export const HRE_OH_SO_CLOSE_SHARDS = 25
