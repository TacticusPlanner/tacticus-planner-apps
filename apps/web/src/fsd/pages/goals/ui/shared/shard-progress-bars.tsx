import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import type { ResourceNeed } from "@/features/goal-farming"
import { StackedProgressBar } from "./stacked-progress-bar"

/** An Ascension goal's shard progress as V1's card showed it: one labelled bar per shard kind the goal
 *  costs, owned shards applied against the goal's own steps ("Shards 120 / 400"). Each is one line in
 *  the level row's style: name, the goal progress bar, then the count. Renders nothing when the goal
 *  costs no shards. */
export function ShardProgressBars({
  shardProgress,
}: {
  shardProgress: ResourceNeed["shardProgress"]
}) {
  const { t, i18n } = useTranslation()
  const isMobile = useIsMobile()
  if (!shardProgress) return null
  const fmt = (value: number) =>
    new Intl.NumberFormat(i18n?.resolvedLanguage).format(value)
  const bars = [
    { key: "shards" as const, ...shardProgress.shards },
    { key: "mythicShards" as const, ...shardProgress.mythicShards },
  ].filter((bar) => bar.needed > 0)
  if (bars.length === 0) return null

  return (
    // One grid for both lines, so the Shards and Mythic shards bars start and end at the same x.
    <div
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 text-xs text-muted-foreground"
      data-testid="goal-shard-progress"
    >
      {bars.map((bar) => {
        const name = t(`goals.resourceChips.${bar.key}`)
        const label = t("goals.resourceChips.poolLabel", {
          name,
          available: fmt(bar.owned),
          needed: fmt(bar.needed),
        })
        return (
          <div
            className="col-span-3 grid grid-cols-subgrid items-center"
            data-testid={`goal-shard-progress-${bar.key}`}
            key={bar.key}
          >
            <span className="whitespace-nowrap">{name}</span>
            <div className="min-w-0">
              <StackedProgressBar
                actualRatio={bar.owned / bar.needed}
                ceilingLabel={null}
                ceilingRatio={null}
                label={label}
                mobile={isMobile}
                potentialRatio={undefined}
                valueText={label}
              />
            </div>
            <span
              aria-hidden
              className="font-semibold whitespace-nowrap text-foreground tabular-nums"
            >
              {fmt(bar.owned)} / {fmt(bar.needed)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
