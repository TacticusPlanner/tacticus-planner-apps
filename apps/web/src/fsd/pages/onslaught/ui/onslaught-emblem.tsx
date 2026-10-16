import { useTranslation } from "react-i18next"
import {
  onslaughtTierIcon,
  type OnslaughtRewardStorageModel,
} from "@workspace/game-catalog"

import {
  onslaughtReward,
  rewardKeys,
  type OnslaughtSector,
  type OnslaughtTier,
} from "@/entities/player-data-override"
import { EntityIcon, ProgressionBadge } from "@/shared/ui"

import {
  formatReward,
  rewardProgression,
  useOnslaughtPositionLabel,
} from "./onslaught-position"

export function OnslaughtEmblem({
  sector,
  tier,
  className = "size-7",
}: {
  sector: OnslaughtSector
  tier: OnslaughtTier
  className?: string
}) {
  const positionLabel = useOnslaughtPositionLabel()
  return (
    <EntityIcon
      src={onslaughtTierIcon(sector, tier)}
      alt={positionLabel(sector, tier)}
      className={className}
    />
  )
}

export function AllianceYield({
  rewards,
  sector,
  tier,
  testId,
}: {
  rewards: readonly OnslaughtRewardStorageModel[]
  sector: OnslaughtSector
  tier: OnslaughtTier
  testId: string
}) {
  const { t } = useTranslation()
  return (
    <div className="col-span-2 grid gap-1.5" data-testid={testId}>
      <span className="text-sm font-medium">{t("onslaught.yieldPerRun")}</span>
      <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm">
        {rewardKeys.map((key) => {
          const reward = onslaughtReward(rewards, sector, tier, key)
          if (!reward) return null
          return (
            <li key={key} className="inline-flex items-center gap-1">
              <ProgressionBadge value={rewardProgression[key]} />
              <span className="sr-only">{t(`onslaught.rewards.${key}`)}</span>
              <span className={reward.mythic ? "text-violet-500" : undefined}>
                {formatReward(reward)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
