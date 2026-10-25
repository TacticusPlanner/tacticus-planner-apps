import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import {
  abilityBadgeIcon,
  goldIcon,
  orbIcon,
  raidTicketIcon,
  xpBookIcon,
  type QuestCrateStorageModel,
} from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import type {
  QuestCrateView,
  QuestShards,
  ShardMeaning,
} from "../model/quest-rewards"

type CrateReward = QuestCrateStorageModel["rewards"][number]

function rewardIcon(reward: CrateReward, alliance: string | null) {
  const rarity = reward.rarity ?? "Common"
  switch (reward.type) {
    case "Coins":
      return goldIcon()
    case "RaidTicket":
      return raidTicketIcon()
    case "XpBook":
      return xpBookIcon(rarity)
    case "AbilityBadge":
      return alliance ? abilityBadgeIcon(rarity, alliance) : undefined
    case "AscensionOrb":
      return orbIcon(rarity)
  }
}

function CrateRewards({
  rewards,
  alliance,
}: {
  rewards: readonly CrateReward[]
  alliance: string | null
}) {
  const { t, i18n } = useTranslation(["quest", "progression"])
  const number = new Intl.NumberFormat(i18n.language)
  const rarity = (value: string | null | undefined) =>
    value ? t(`progression:rarities.${value as Rarity}`) : ""
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {rewards.map((reward, index) => {
        const name =
          reward.type === "AbilityBadge" && reward.maxRarity
            ? t("quest:rewards.reward.AbilityBadgeRange", {
                rarity: rarity(reward.rarity),
                maxRarity: rarity(reward.maxRarity),
              })
            : t(`quest:rewards.reward.${reward.type}`, {
                rarity: rarity(reward.rarity),
              })
        const amount =
          reward.min === reward.max
            ? t("quest:rewards.amount", { amount: number.format(reward.min) })
            : t("quest:rewards.amountRange", {
                min: number.format(reward.min),
                max: number.format(reward.max),
              })
        return (
          <li
            className="inline-flex items-center gap-1 text-sm"
            key={`${reward.type}-${index}`}
          >
            <EntityIcon
              alt=""
              className="size-5 object-contain"
              src={rewardIcon(reward, alliance)}
            />
            <span>{name}</span>
            <span className="text-muted-foreground tabular-nums">{amount}</span>
          </li>
        )
      })}
    </ul>
  )
}

function ShardsMeaningLine({
  meaning,
  hero,
}: {
  meaning: ShardMeaning
  hero: string
}) {
  const { t, i18n } = useTranslation(["quest", "progression"])
  const number = new Intl.NumberFormat(i18n.language)
  if (meaning.kind === "unknown") {
    return (
      <p className="text-sm text-muted-foreground">
        {t("quest:rewards.shardsOnly", { hero })}
      </p>
    )
  }
  if (meaning.kind === "unlock") {
    return (
      <div className="space-y-0.5 text-sm" data-testid="quest-shards-meaning">
        <p className="font-medium">
          {meaning.spare > 0
            ? t("quest:rewards.unlocks", {
                hero,
                spare: number.format(meaning.spare),
              })
            : meaning.spare === 0
              ? t("quest:rewards.unlocksExact", { hero })
              : t("quest:rewards.short", {
                  hero,
                  short: number.format(-meaning.spare),
                })}
        </p>
        {meaning.reachedSoFar ? (
          <p className="text-muted-foreground">
            {t("quest:rewards.unlockedSoFar")}
          </p>
        ) : null}
      </div>
    )
  }
  const last = meaning.steps.at(-1)
  const [lastRarity, lastStars] = last?.split(":") ?? []
  const lastLabel = last
    ? `${t(`progression:rarities.${lastRarity}` as never) as string} ${
        t(`progression:stars.${lastStars}` as never, {
          defaultValue: last,
        }) as string
      }`
    : ""
  return (
    <div className="space-y-0.5 text-sm" data-testid="quest-shards-meaning">
      <p className="font-medium">
        {last
          ? t("quest:rewards.ascend", {
              count: meaning.steps.length,
              last: lastLabel,
            })
          : t("quest:rewards.ascendNone")}
      </p>
      {last ? (
        <p className="text-muted-foreground">
          {t("quest:rewards.ascendSoFar", { count: meaning.reachedSoFar })}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {t("quest:rewards.orbsNote")}
      </p>
    </div>
  )
}

/**
 * What the quest pays (spec: quest-event-rewards): the crate track against the score (opened marked,
 * the next one highlighted with the points it needs), the featured hero's shards from medals with
 * the Quest Bundle toggle, what they mean for the hero, and the goal action. On mobile the card is a
 * disclosure, collapsed by default. `crates` null shows the crate error with Retry only.
 */
export function RewardsCard({
  crates,
  retryCrates,
  alliance,
  hero,
  shards,
  meaning,
  bundle,
  onBundleChange,
  goalAction,
  isMobile,
  open,
  onOpenChange,
}: {
  crates: QuestCrateView<QuestCrateStorageModel>[] | null
  retryCrates: () => void
  alliance: string | null
  hero: string
  shards: QuestShards
  meaning: ShardMeaning
  bundle: boolean
  /** Null when the bundle cannot be changed (a preview or a browsed quest). */
  onBundleChange: ((bundle: boolean) => void) | null
  goalAction: ReactNode
  isMobile: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t, i18n } = useTranslation("quest")
  const number = new Intl.NumberFormat(i18n.language)
  const body = (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-2" data-testid="quest-rewards-shards">
        <h4 className="text-sm font-semibold">
          {t("rewards.shardsTitle", { hero })}
        </h4>
        <p className="text-sm tabular-nums" data-testid="quest-shards-line">
          {t("rewards.shards", {
            earned: number.format(shards.earned),
            max: number.format(shards.max),
            reachable: number.format(shards.reachable),
          })}
        </p>
        <div className="flex items-center gap-2">
          <Switch
            checked={bundle}
            disabled={onBundleChange === null}
            id="quest-bundle"
            onCheckedChange={(checked) => onBundleChange?.(checked)}
          />
          <Label className="text-sm font-normal" htmlFor="quest-bundle">
            {t("rewards.bundle")}
          </Label>
        </div>
        <ShardsMeaningLine hero={hero} meaning={meaning} />
        <div>{goalAction}</div>
      </div>
      {crates === null ? (
        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="quest-crates-error"
        >
          <p className="text-sm text-destructive">{t("rewards.cratesError")}</p>
          <Button onClick={retryCrates} size="sm" variant="outline">
            {t("status.retry")}
          </Button>
        </div>
      ) : (
        <ol className="flex flex-col gap-2" data-testid="quest-crate-track">
          {crates.map(({ crate, opened, next, pointsToGo }) => (
            <li
              className={cn(
                "flex flex-col gap-1 rounded-lg border p-2",
                next && "border-primary bg-muted",
                opened && "opacity-80"
              )}
              data-next={next ? "true" : undefined}
              data-opened={opened ? "true" : undefined}
              data-testid="quest-crate"
              key={crate.number}
            >
              <p className="flex flex-wrap items-center gap-x-2 text-sm">
                <span className="font-semibold">
                  {t("rewards.crate", { number: crate.number })}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {t("rewards.cratePoints", {
                    points: number.format(crate.points),
                  })}
                </span>
                {opened ? (
                  <span className="inline-flex items-center gap-0.5 text-green-700 dark:text-green-400">
                    <CheckIcon aria-hidden className="size-3.5" />
                    {t("rewards.opened")}
                  </span>
                ) : next ? (
                  <span className="font-medium" data-testid="quest-crate-to-go">
                    {t("rewards.pointsToGo", {
                      points: number.format(pointsToGo),
                    })}
                  </span>
                ) : null}
              </p>
              <CrateRewards alliance={alliance} rewards={crate.rewards} />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
  return (
    <section
      aria-labelledby="quest-rewards-title"
      className="flex min-w-0 flex-col gap-3 rounded-xl border p-4"
      data-testid="quest-rewards"
    >
      {isMobile ? (
        <h3 id="quest-rewards-title">
          <button
            aria-controls="quest-rewards-body"
            aria-expanded={open}
            className="flex min-h-11 w-full items-center justify-between font-semibold"
            data-testid="quest-rewards-toggle"
            onClick={() => onOpenChange(!open)}
            type="button"
          >
            {t("rewards.toggle")}
            <ChevronDownIcon
              aria-hidden
              className={cn(
                "size-4 transition-transform",
                open && "rotate-180"
              )}
            />
          </button>
        </h3>
      ) : (
        <h3 className="font-semibold" id="quest-rewards-title">
          {t("rewards.title")}
        </h3>
      )}
      <div hidden={isMobile && !open} id="quest-rewards-body">
        {!isMobile || open ? body : null}
      </div>
    </section>
  )
}
