import type { TFunction } from "i18next"
import {
  progressionOrder,
  progressionRarity,
  rankOrder,
} from "@workspace/game-domain"

import { progressionLabel } from "@/entities/goal"
import { ProgressionBadge, RankBadge } from "@/shared/ui"

import type { LadderStep } from "./target-ladder"

/** The Rank ladder: every rank, grouped by its metal (Stone, Iron, …). A step's key is the rank. */
export function rankLadderSteps(t: TFunction): LadderStep[] {
  return rankOrder.map((rank) => ({
    key: rank,
    label: <RankBadge className="gap-1" iconClassName="size-5" rank={rank} />,
    name: t(`ranks.${rank}`, { ns: "progression", defaultValue: rank }),
    tier: rank.replace(/\d+$/, ""),
  }))
}

/** The Ascension ladder: every step, grouped by rarity. A step's key is the progression. */
export function progressionLadderSteps(t: TFunction): LadderStep[] {
  return progressionOrder.map((step) => {
    const rarity = progressionRarity(step)
    return {
      key: step,
      label: <ProgressionBadge value={step} />,
      name: progressionLabel(t, step),
      tier: rarity,
      tierLabel: t(`rarities.${rarity}`, {
        ns: "progression",
        defaultValue: rarity,
      }),
    }
  })
}
