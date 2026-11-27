import { useTranslation } from "react-i18next"
import type {
  GameCatalogEventShopRewardRange,
  GameCatalogEventShopRewardTier,
} from "@workspace/game-catalog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"
import { numberFormat } from "@/shared/lib"

import { ladderView } from "../lib/event-mission-text"
import type { LadderTile } from "../lib/event-mission-text"
import type { EventRewardFormat } from "../model/use-event-reward-format"
import { rewardAmount } from "../lib/reward-amount"
import { RewardPanel, RewardText } from "./reward-panel"

type Reward = Pick<GameCatalogEventShopRewardRange, "type" | "min" | "max">

/** "10k", "22.5k" from 10,000 up (as the tiles have room for); exact below. */
function useCompactNumber() {
  const { i18n } = useTranslation()
  const compact = numberFormat(i18n.language, {
    notation: "compact",
    maximumFractionDigits: 1,
  })
  const exact = numberFormat(i18n.language)
  return (value: number) =>
    value >= 10_000 ? compact.format(value) : exact.format(value)
}

/** One tier as a tile: points, the main reward with its icon, and any extra rewards under it. */
function TierTile({
  tile,
  format,
}: {
  tile: LadderTile
  format: EventRewardFormat
}) {
  const { t } = useTranslation("eventShops")
  const compact = useCompactNumber()
  const amount = (reward: Reward, shown: "min" | "range") =>
    shown === "min" || reward.min === reward.max
      ? compact(reward.min)
      : `${compact(reward.min)}–${compact(reward.max)}`
  // A single item (a token, a profile theme) reads better by name than as "1".
  const single = (reward: Reward) => reward.min === 1 && reward.max === 1
  const [main, ...extras] = tile.rewards
  const label = tile.rewards
    .map(
      (reward) =>
        `${format.reward(reward.reward.type).label} ${rewardAmount(reward.reward, format)}`
    )
    .join(", ")
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <li
          aria-label={`${t("rewards.points", {
            points: format.number(tile.requiredProgress),
          })}: ${label}`}
          className={cn(
            "flex min-w-0 flex-col gap-0.5 rounded-md border bg-card p-2",
            // A highlighted tier spans two columns: its rewards are named, not just counted.
            tile.special && "col-span-2 border-primary bg-primary/10"
          )}
          data-special={tile.special ? "true" : "false"}
        >
          <span className="text-xs font-bold text-muted-foreground tabular-nums">
            {format.number(tile.requiredProgress)}
          </span>
          {main ? (
            <span className="flex min-w-0 items-start gap-1 text-sm font-bold">
              <EntityIcon
                size="icon"
                alt=""
                className="shrink-0"
                src={format.reward(main.reward.type).iconUrl}
              />
              <span className="line-clamp-2 wrap-break-word tabular-nums">
                {single(main.reward)
                  ? format.reward(main.reward.type).label
                  : amount(main.reward, main.shown)}
              </span>
            </span>
          ) : null}
          {extras.map((extra) => (
            <span
              key={extra.reward.type}
              className="flex min-w-0 items-start gap-1 text-xs text-muted-foreground"
            >
              <EntityIcon
                size="icon"
                alt=""
                className="shrink-0"
                src={format.reward(extra.reward.type).iconUrl}
              />
              <span className="line-clamp-2 wrap-break-word tabular-nums">
                {single(extra.reward)
                  ? `+ ${format.reward(extra.reward.type).label}`
                  : `+${amount(extra.reward, extra.shown)}`}
              </span>
            </span>
          ))}
        </li>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** A ladder as dense tiles (canvas M2), with its header total and any "rolls up to +N%" note. */
export function RewardLadder({
  label,
  tiers,
  format,
  testId,
  phone,
  empty,
}: {
  label: string
  tiers: readonly GameCatalogEventShopRewardTier[]
  format: EventRewardFormat
  testId: string
  phone: boolean
  /** Shown when the ladder has no tier. */
  empty: string
}) {
  const { t } = useTranslation("eventShops")
  const view = ladderView(tiers)
  const note = (
    <>
      {view.total ? (
        <RewardText
          format={format}
          rewards={[view.total]}
          suffix={t("rewards.inTotal")}
        />
      ) : null}
      {view.spreads.map((spread) => (
        <span key={spread.type}>
          {t("rewards.rollsUp", {
            reward: format.reward(spread.type).label,
            percent: spread.percent,
          })}
        </span>
      ))}
    </>
  )
  return (
    <RewardPanel label={label} note={note} testId={testId}>
      {tiers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ol
          className={cn(
            "grid gap-1.5",
            phone
              ? "grid-cols-5"
              : "grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))]"
          )}
        >
          {view.tiles.map((tile) => (
            <TierTile key={tile.requiredProgress} format={format} tile={tile} />
          ))}
        </ol>
      )}
    </RewardPanel>
  )
}
