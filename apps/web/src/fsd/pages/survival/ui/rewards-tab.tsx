import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { EntityIcon, HowToRead } from "@/shared/ui"
import {
  RewardLadder,
  RewardPanel,
  RewardText,
  useEventRewardFormat,
} from "@/widgets/event-rewards"

import { useSurvivalContext } from "../model/survival-context"

/**
 * Rewards: the event milestones as tiles, the progress chests as rows (cost, then rewards), the featured
 * hero's rarity rewards, and "Where points come from" (plan option 13).
 */
export function RewardsTab() {
  const { t } = useTranslation(["survival", "progression"])
  const { event } = useSurvivalContext()
  const isMobile = useIsMobile()
  const format = useEventRewardFormat()
  const { points } = event
  const sources = [
    { key: "freeMissions", value: points.freeMissions },
    { key: "premiumMissions", value: points.premiumMissions },
    { key: "survivalFree", value: points.survivalFree },
    { key: "survivalPremium", value: points.survivalPremium },
  ] as const
  return (
    <div className="flex flex-col gap-4">
      <RewardLadder
        empty={t("survival:rewards.none")}
        format={format}
        label={t("survival:rewards.milestones")}
        phone={isMobile}
        testId="survival-milestones"
        tiers={event.milestones}
      />
      <RewardPanel
        label={t("survival:rewards.chests", { count: event.chests.length })}
        testId="survival-chests"
      >
        {event.chests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("survival:rewards.none")}
          </p>
        ) : (
          <ol className="flex flex-col divide-y">
            {event.chests.map((chest) => (
              <li
                className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
                data-testid={`survival-chest-${chest.level}`}
                key={chest.level}
              >
                <span className="inline-flex min-w-28 items-center gap-1 text-sm font-medium tabular-nums">
                  {t("survival:rewards.chest", { level: chest.level })}
                  <span aria-hidden="true">·</span>
                  <EntityIcon
                    alt=""
                    size="icon"
                    src={format.currencyIcon(chest.cost.type)}
                  />
                  <span
                    aria-label={t("survival:rewards.cost", {
                      amount: format.number(chest.cost.amount),
                    })}
                  >
                    {format.number(chest.cost.amount)}
                  </span>
                </span>
                <RewardText format={format} rewards={chest.rewards} />
              </li>
            ))}
          </ol>
        )}
      </RewardPanel>
      {event.scoring.rarityMilestones.length > 0 ? (
        <RewardPanel
          label={t("survival:rewards.rarityMilestones")}
          testId="survival-rarity-milestones"
        >
          <ul className="flex flex-col gap-1.5">
            {event.scoring.rarityMilestones.map((milestone) => (
              <li
                className="flex flex-wrap items-center gap-x-3 gap-y-1"
                key={milestone.rarity}
              >
                <span className="min-w-28 text-sm font-medium">
                  {t(`progression:rarities.${milestone.rarity}` as never, {
                    defaultValue: milestone.rarity,
                  })}
                </span>
                <RewardText format={format} rewards={milestone.rewards} />
              </li>
            ))}
          </ul>
        </RewardPanel>
      ) : null}
      <HowToRead
        data-testid="survival-points"
        summary={t("survival:rewards.points.summary")}
      >
        <ul className="flex flex-col gap-1">
          {sources.map((source) => (
            <li className="flex justify-between gap-3" key={source.key}>
              <span>{t(`survival:rewards.points.${source.key}`)}</span>
              <span className="tabular-nums">
                {format.number(source.value)}
              </span>
            </li>
          ))}
          <li className="flex justify-between gap-3 font-medium text-foreground">
            <span>{t("survival:rewards.points.max")}</span>
            <span className="tabular-nums">{format.number(points.max)}</span>
          </li>
        </ul>
      </HowToRead>
    </div>
  )
}
