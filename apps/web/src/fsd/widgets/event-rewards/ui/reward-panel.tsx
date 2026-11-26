import { Fragment } from "react"
import type { ReactNode } from "react"
import type { GameCatalogEventShopRewardRange } from "@workspace/game-catalog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { hasNode } from "@/shared/lib"
import { EntityIcon } from "@/shared/ui"

import { rewardAmount } from "../lib/reward-amount"
import type { EventRewardFormat } from "../model/use-event-reward-format"

type Reward = Pick<GameCatalogEventShopRewardRange, "type" | "min" | "max">

/** A card with a label and a note on the right ("Daily · 6 a day · 600 Event points a day"). */
export function RewardPanel({
  label,
  note,
  children,
  testId,
  className,
}: {
  label: string
  note?: ReactNode
  children: ReactNode
  testId?: string
  className?: string
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4",
        className
      )}
      data-testid={testId}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-xs font-semibold text-muted-foreground">{label}</h3>
        {hasNode(note) ? (
          <span className="inline-flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
            {note}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/** "[icon] 90 + [icon] 50": each reward's icon and amount, its name in a tooltip (a single item
 *  shows its icon alone). */
function CompactReward({
  reward,
  format,
}: {
  reward: Reward
  format: EventRewardFormat
}) {
  const text = format.reward(reward.type)
  const amount = rewardAmount(reward, format)
  const single = reward.min === 1 && reward.max === 1
  const label = single ? text.label : `${amount} ${text.label}`
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={label}
          className="inline-flex items-center gap-1"
          role="img"
        >
          <EntityIcon size="icon" alt="" src={text.iconUrl} />
          {single ? null : (
            <span className="font-semibold text-foreground tabular-nums">
              {amount}
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** "[icon] 90 Event points + [icon] 50 Event currency"; `compact` drops the names into tooltips. */
export function RewardText({
  rewards,
  format,
  suffix,
  compact = false,
}: {
  rewards: readonly Reward[]
  format: EventRewardFormat
  suffix?: string
  compact?: boolean
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
      {rewards.map((reward, index) => {
        const text = format.reward(reward.type)
        if (compact) {
          return (
            <Fragment key={reward.type}>
              {index > 0 ? <span aria-hidden="true">+</span> : null}
              <CompactReward format={format} reward={reward} />
            </Fragment>
          )
        }
        return (
          <Fragment key={reward.type}>
            {index > 0 ? <span aria-hidden="true">+</span> : null}
            <span className="inline-flex items-center gap-1">
              <EntityIcon size="icon" alt="" src={text.iconUrl} />
              <span>
                <span className="font-semibold text-foreground tabular-nums">
                  {rewardAmount(reward, format)}
                </span>{" "}
                {text.label}
              </span>
            </span>
          </Fragment>
        )
      })}
      {suffix ? <span>{suffix}</span> : null}
    </span>
  )
}
