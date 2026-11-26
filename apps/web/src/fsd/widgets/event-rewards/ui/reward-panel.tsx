import { Fragment } from "react"
import type { ReactNode } from "react"
import type { GameCatalogEventShopRewardRange } from "@workspace/game-catalog"
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

/** "[icon] 90 Event points + [icon] 50 Event currency". */
export function RewardText({
  rewards,
  format,
  suffix,
}: {
  rewards: readonly Reward[]
  format: EventRewardFormat
  suffix?: string
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
      {rewards.map((reward, index) => {
        const text = format.reward(reward.type)
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
