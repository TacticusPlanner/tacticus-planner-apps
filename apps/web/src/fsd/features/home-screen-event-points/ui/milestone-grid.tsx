import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Infinity as InfinityIcon } from "lucide-react"
import { chestIcon, type GameCatalogHseTier } from "@workspace/game-catalog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import { EntityIcon } from "@/shared/ui"

import { hseMilestoneCells } from "../lib/hse-milestones"
import { hseRewardDisplay } from "../lib/hse-reward"

const NO_UNITS = new Map<string, { name: string }>()
// A reward the display has no art for shows the game's plain reward crate.
const genericRewardIcon = chestIcon("wood")

/**
 * The tier's milestone grid, after V1's Learn > HSEs page: each cell shows the points it adds, the
 * reward icon and quantity, and a tooltip naming the reward and its cumulative points; the repeat
 * step is the last cell, marked endless. Three columns on mobile, five from 768px.
 */
export function MilestoneGrid({
  tier,
  pointsIcon,
}: {
  tier: Pick<GameCatalogHseTier, "milestones" | "repeat">
  /** The event's points icon, beside each cell's points. */
  pointsIcon?: string
}) {
  const { t, i18n } = useTranslation([
    "shops",
    "characters",
    "upgrades",
    "equipmentItems",
  ])
  const { t: td } = useTranslation("dailies")
  const numbers = new Intl.NumberFormat(i18n.language)

  const cells = useMemo(() => {
    const context = {
      t,
      charactersById: NO_UNITS,
      mowsById: NO_UNITS,
      equipmentById: NO_UNITS,
    }
    const translate = td as unknown as (key: string) => string
    return hseMilestoneCells(tier).map((cell) => ({
      ...cell,
      reward: hseRewardDisplay(cell.rewardId, context, translate),
    }))
  }, [tier, t, td])

  return (
    <section className="space-y-2" data-testid="hse-milestones">
      <h3 className="text-sm font-semibold">{td("hse.details.milestones")}</h3>
      <ol className="grid grid-cols-3 gap-2 md:grid-cols-5">
        {cells.map((cell, index) => {
          const tooltip = cell.endless
            ? td("hse.details.endlessTooltip", {
                reward: cell.reward.label,
                quantity: cell.quantity,
                points: numbers.format(cell.points),
              })
            : td("hse.details.milestoneTooltip", {
                reward: cell.reward.label,
                quantity: cell.quantity,
                points: numbers.format(cell.cumulativePoints),
              })
          return (
            <li key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label={tooltip}
                    className="relative flex w-full flex-col items-center gap-1 rounded-lg border bg-card p-2 text-card-foreground"
                    data-endless={cell.endless || undefined}
                    data-testid="hse-milestone"
                    type="button"
                  >
                    {cell.endless ? (
                      <span
                        className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                        title={td("hse.details.endless")}
                      >
                        <InfinityIcon aria-hidden="true" className="size-3.5" />
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1">
                      <EntityIcon
                        alt=""
                        className="size-8"
                        src={cell.reward.iconUrl ?? genericRewardIcon}
                      />
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        {td("hse.details.milestoneQuantity", {
                          quantity: cell.quantity,
                        })}
                      </span>
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                      data-testid="hse-milestone-points"
                    >
                      {pointsIcon ? (
                        <EntityIcon
                          alt=""
                          className="size-3.5 shrink-0"
                          src={pointsIcon}
                        />
                      ) : null}
                      {td("hse.details.milestonePoints", {
                        points: numbers.format(cell.points),
                      })}
                    </span>
                    {cell.endless && cell.cap !== null ? (
                      <span className="text-[11px] text-muted-foreground">
                        {td("hse.details.endlessCap", { count: cell.cap })}
                      </span>
                    ) : null}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
              </Tooltip>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
