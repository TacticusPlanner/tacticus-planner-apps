import { Fragment, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  eventDays,
  type GameCatalogEventShopMissionChain,
  type GameCatalogEventShopRewardRange,
  type GameCatalogEventShopRewardTier,
  type GameCatalogEventShopTask,
} from "@workspace/game-catalog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import {
  fillGameText,
  ladderView,
  sumRewards,
  type LadderTile,
} from "../../model/event-mission-text"
import type { EventShopController } from "./use-event-shop-controller"
import type { EventShopFormat } from "./use-event-shop-format"

type Reward = Pick<GameCatalogEventShopRewardRange, "type" | "min" | "max">

/** "10k", "22.5k" from 10,000 up (as the tiles have room for); exact below. */
function useCompactNumber() {
  const { i18n } = useTranslation()
  const compact = new Intl.NumberFormat(i18n.language, {
    notation: "compact",
    maximumFractionDigits: 1,
  })
  const exact = new Intl.NumberFormat(i18n.language)
  return (value: number) =>
    value >= 10_000 ? compact.format(value) : exact.format(value)
}

/**
 * The reference notice and, for an event longer than a week, the week the tab shows (the Shop tab's day
 * picker is hidden here, so this is the only way to another week's chests and missions).
 */
function RewardsHeader({
  controller,
  onSelectDay,
  weekPicker,
}: {
  controller: EventShopController
  onSelectDay: (dayIndex: number) => void
  weekPicker: boolean
}) {
  const { t } = useTranslation("eventShops")
  const weeks = controller.event.weeks.map((week) => week.week)
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        {t("rewards.referenceOnly")}
      </p>
      {weekPicker && weeks.length > 1 ? (
        <Select
          onValueChange={(value) => {
            const day = eventDays(controller.event).find(
              (candidate) => candidate.week === Number(value)
            )
            if (day) onSelectDay(day.index)
          }}
          value={String(controller.selectedDay.week)}
        >
          <SelectTrigger
            aria-label={t("rewards.weekPicker")}
            className="w-32"
            data-testid="event-shop-rewards-week"
            size="sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {weeks.map((week) => (
              <SelectItem key={week} value={String(week)}>
                {t("days.week", { week })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  )
}

/** A card with an uppercase label and a note on the right ("DAILY · 6 A DAY · 600 Event points a day"). */
function Panel({
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
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </h3>
        {note ? (
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
function RewardText({
  rewards,
  format,
  suffix,
}: {
  rewards: readonly Reward[]
  format: EventShopFormat
  suffix?: string
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
      {rewards.map((reward, index) => {
        const text = format.reward(reward.type)
        const amount =
          reward.min === reward.max
            ? format.number(reward.min)
            : `${format.number(reward.min)}–${format.number(reward.max)}`
        return (
          <Fragment key={reward.type}>
            {index > 0 ? <span aria-hidden="true">+</span> : null}
            <span className="inline-flex items-center gap-1">
              <EntityIcon alt="" className="size-4" src={text.iconUrl} />
              <span>
                <span className="font-semibold text-foreground tabular-nums">
                  {amount}
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

/** One tier as a tile: points, the main reward with its icon, and any extra rewards under it. */
function TierTile({
  tile,
  format,
}: {
  tile: LadderTile
  format: EventShopFormat
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
        `${format.reward(reward.reward.type).label} ${
          reward.reward.min === reward.reward.max
            ? format.number(reward.reward.min)
            : `${format.number(reward.reward.min)}–${format.number(reward.reward.max)}`
        }`
    )
    .join(", ")
  return (
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
      title={label}
    >
      <span className="text-xs font-bold text-muted-foreground tabular-nums">
        {format.number(tile.requiredProgress)}
      </span>
      {main ? (
        <span className="flex min-w-0 items-start gap-1 text-sm font-bold">
          <EntityIcon
            alt=""
            className="size-4 shrink-0"
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
            alt=""
            className="size-3.5 shrink-0"
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
  )
}

/** A ladder as dense tiles (canvas M2), with its header total and any "rolls up to +N%" note. */
function TierTiles({
  label,
  tiers,
  format,
  testId,
  phone,
}: {
  label: string
  tiers: readonly GameCatalogEventShopRewardTier[]
  format: EventShopFormat
  testId: string
  phone: boolean
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
    <Panel label={label} note={note} testId={testId}>
      {tiers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("rewards.none")}</p>
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
    </Panel>
  )
}

/** Milestones (canvas M2): the event's ladder and the selected week's progress chests as tiles. */
export function EventShopMilestones({
  controller,
  format,
  onSelectDay,
  weekPicker = true,
  phone = false,
}: {
  controller: EventShopController
  format: EventShopFormat
  onSelectDay: (dayIndex: number) => void
  weekPicker?: boolean
  phone?: boolean
}) {
  const { t } = useTranslation("eventShops")
  const week = controller.event.weeks.find(
    (candidate) => candidate.week === controller.selectedDay.week
  )
  return (
    <div className="flex flex-col gap-4" data-testid="event-shop-milestones">
      <RewardsHeader
        controller={controller}
        onSelectDay={onSelectDay}
        weekPicker={weekPicker}
      />
      <TierTiles
        format={format}
        label={t("rewards.milestones")}
        phone={phone}
        testId="event-shop-milestone-ladder"
        tiers={controller.event.milestones}
      />
      <TierTiles
        format={format}
        label={t("rewards.chests", { week: controller.selectedDay.week })}
        phone={phone}
        testId="event-shop-chest-ladder"
        tiers={week?.progressChests ?? []}
      />
    </div>
  )
}

/** A task's game text with its target and parameters filled in, or with the target left out. */
function useTaskText() {
  const { i18n } = useTranslation("eventMissions")
  const read = (key: string): string | undefined => {
    const value: unknown =
      i18n.getResource(i18n.language, "eventMissions", key) ??
      i18n.getResource("en", "eventMissions", key)
    return typeof value === "string" ? value : undefined
  }
  const gameMode = (mode: string) => read(`gameModes.${mode}`) ?? mode
  const values = (task: GameCatalogEventShopTask) => {
    const parameters = task.parameters ?? {}
    const modes = parameters.gameModes
    const filled: Record<string, string> = {}
    if (typeof parameters.gameMode === "string") {
      filled.GAME_MODE = gameMode(parameters.gameMode)
    }
    if (modes !== undefined) {
      filled.GAME_MODES = (Array.isArray(modes) ? modes : [modes])
        .map(gameMode)
        .join(", ")
    }
    if (typeof parameters.factionTrait === "string") {
      filled.FACTION_TRAIT = parameters.factionTrait
    }
    return filled
  }
  const template = (task: GameCatalogEventShopTask) =>
    read(`tasks.${task.taskId}`) ?? task.taskId
  return {
    task: (task: GameCatalogEventShopTask) =>
      fillGameText(
        template(task),
        {
          ...values(task),
          TARGET_AMOUNT: task.target.toLocaleString(i18n.language),
        },
        task.target
      ),
    /** "Deal Damage using Abilities": the chain's task without one mission's target. */
    taskName: (task: GameCatalogEventShopTask) =>
      fillGameText(template(task), { ...values(task), TARGET_AMOUNT: "" }, 2)
        .replace(/\s{2,}/g, " ")
        .trim(),
  }
}

/** A chain (canvas Mi1): its task, a bar per mission scaled by its target, and what it pays. */
function ChainCard({
  chain,
  kind,
  format,
}: {
  chain: GameCatalogEventShopMissionChain
  kind: "free" | "premium"
  format: EventShopFormat
}) {
  const { t } = useTranslation("eventShops")
  const text = useTaskText()
  const missions = chain.missions
  const targets = missions.map((mission) => mission.tasks[0]?.target ?? 0)
  const highest = Math.max(1, ...targets)
  const taskNames = [
    ...new Set(
      missions.flatMap((mission) =>
        mission.tasks.map((task) => text.taskName(task))
      )
    ),
  ]
  const same = (a: readonly Reward[], b: readonly Reward[]) =>
    a.length === b.length &&
    a.every(
      (reward, index) =>
        reward.type === b[index]?.type &&
        reward.min === b[index].min &&
        reward.max === b[index].max
    )
  const each = missions.every((mission) =>
    same(mission.rewards, missions[0]?.rewards ?? [])
  )
    ? missions[0]?.rewards
    : null
  const last = missions.length

  return (
    <Panel
      className="bg-background"
      label={t("rewards.chainLabel", {
        kind: t(`rewards.${kind}`),
        count: last,
      })}
      note={<RewardText format={format} rewards={sumRewards(missions)} />}
      testId={`event-shop-chain-${chain.id}`}
    >
      <p className="text-sm font-semibold">{taskNames.join(" · ")}</p>
      <div aria-hidden="true" className="flex h-12 items-end gap-0.5">
        {targets.map((target, index) => (
          <span
            key={missions[index]!.id}
            className={cn(
              "min-h-1.5 flex-1 rounded-t-sm",
              kind === "premium" ? "bg-amber-500" : "bg-primary"
            )}
            style={{ height: `${Math.round((target / highest) * 100)}%` }}
            title={`${index + 1}: ${format.number(target)}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>
          {t("rewards.step", {
            position: 1,
            target: format.number(targets[0] ?? 0),
          })}
        </span>
        <span>
          {t("rewards.step", {
            position: last,
            target: format.number(targets[last - 1] ?? 0),
          })}
        </span>
      </div>
      {each ? (
        <RewardText format={format} rewards={each} suffix={t("rewards.each")} />
      ) : null}
      {/* Every mission in words for assistive tech; the bars show the same. */}
      <ol className="sr-only">
        {missions.map((mission, index) => (
          <li key={mission.id}>
            {t("rewards.position", { position: index + 1, length: last })}:{" "}
            {mission.tasks.map((task) => text.task(task)).join(", ")}
          </li>
        ))}
      </ol>
    </Panel>
  )
}

/** Missions (canvas Mi1): the week's daily missions as tiles and its chains as bar charts. */
export function EventShopMissions({
  controller,
  format,
  onSelectDay,
  weekPicker = true,
  phone = false,
}: {
  controller: EventShopController
  format: EventShopFormat
  onSelectDay: (dayIndex: number) => void
  weekPicker?: boolean
  phone?: boolean
}) {
  const { t } = useTranslation("eventShops")
  const text = useTaskText()
  const week = controller.event.weeks.find(
    (candidate) => candidate.week === controller.selectedDay.week
  )
  const missions = week?.missions
  const daily = missions?.daily ?? []
  const chains = [
    ...(missions?.free ?? []).map((chain) => ({
      chain,
      kind: "free" as const,
    })),
    ...(missions?.premium ?? []).map((chain) => ({
      chain,
      kind: "premium" as const,
    })),
  ]
  const none = (
    <p className="text-sm text-muted-foreground">{t("rewards.none")}</p>
  )

  return (
    <div className="flex flex-col gap-4" data-testid="event-shop-missions">
      <RewardsHeader
        controller={controller}
        onSelectDay={onSelectDay}
        weekPicker={weekPicker}
      />
      <Panel
        label={t("rewards.dailyLabel", { count: daily.length })}
        note={
          daily.length > 0 ? (
            <RewardText
              format={format}
              rewards={sumRewards(daily)}
              suffix={t("rewards.aDay")}
            />
          ) : undefined
        }
        testId="event-shop-daily-missions"
      >
        {daily.length === 0 ? (
          none
        ) : (
          <ul
            className={cn(
              phone
                ? "flex flex-col divide-y"
                : "grid grid-cols-2 gap-1.5 lg:grid-cols-3"
            )}
          >
            {daily.map((mission) => (
              <li
                key={mission.id}
                className={cn(
                  "flex min-w-0 gap-1",
                  phone
                    ? "items-center justify-between py-2"
                    : "flex-col rounded-md border p-2"
                )}
                data-testid={`event-shop-mission-${mission.id}`}
              >
                <span className="text-sm font-medium">
                  {mission.tasks.map((task) => text.task(task)).join(", ")}
                </span>
                <RewardText format={format} rewards={mission.rewards} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {chains.length === 0 ? (
        none
      ) : (
        <div
          className={cn("grid gap-3", phone ? "grid-cols-1" : "md:grid-cols-2")}
        >
          {chains.map(({ chain, kind }) => (
            <ChainCard
              key={chain.id}
              chain={chain}
              format={format}
              kind={kind}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Phone: the Rewards tab with a Milestones | Missions switch (canvas M2 and Mi1 phone boards). */
export function EventShopRewardsPhone({
  controller,
  format,
  onSelectDay,
}: {
  controller: EventShopController
  format: EventShopFormat
  onSelectDay: (dayIndex: number) => void
}) {
  const { t } = useTranslation("eventShops")
  const [view, setView] = useState<"milestones" | "missions">("milestones")
  return (
    <div className="flex flex-col gap-3">
      <div
        aria-label={t("rewards.show")}
        className="flex gap-1 rounded-xl bg-muted p-1"
        role="group"
      >
        {(["milestones", "missions"] as const).map((option) => (
          <button
            key={option}
            aria-pressed={view === option}
            className={cn(
              "h-10 flex-1 rounded-lg text-sm font-medium text-muted-foreground",
              view === option && "bg-card text-foreground shadow-sm"
            )}
            data-testid={`event-shop-rewards-${option}`}
            onClick={() => setView(option)}
            type="button"
          >
            {t(`tabs.${option}`)}
          </button>
        ))}
      </div>
      {view === "milestones" ? (
        <EventShopMilestones
          controller={controller}
          format={format}
          onSelectDay={onSelectDay}
          phone
        />
      ) : (
        <EventShopMissions
          controller={controller}
          format={format}
          onSelectDay={onSelectDay}
          phone
        />
      )}
    </div>
  )
}
