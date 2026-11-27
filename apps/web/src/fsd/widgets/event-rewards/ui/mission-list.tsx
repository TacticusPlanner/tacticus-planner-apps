import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import type {
  GameCatalogEventShopMission,
  GameCatalogEventShopMissionChain,
  GameCatalogEventShopRewardRange,
} from "@workspace/game-catalog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { sumRewards } from "../lib/event-mission-text"
import type { EventRewardFormat } from "../model/use-event-reward-format"
import { useTaskText } from "../model/use-task-text"
import { RewardPanel, RewardText } from "./reward-panel"

type Reward = Pick<GameCatalogEventShopRewardRange, "type" | "min" | "max">

const same = (a: readonly Reward[], b: readonly Reward[]) =>
  a.length === b.length &&
  a.every(
    (reward, index) =>
      reward.type === b[index]?.type &&
      reward.min === b[index].min &&
      reward.max === b[index].max
  )

/**
 * A chain (canvas Mi1) and what it pays. A chain that repeats one task with rising targets shows a bar
 * per mission scaled by its target; a chain whose missions differ (another task, or several tasks a
 * mission) lists every mission in words instead, since targets of different tasks don't compare.
 */
export function MissionChainCard({
  chain,
  kind,
  format,
  testIdPrefix = "event-shop",
  children,
}: {
  chain: GameCatalogEventShopMissionChain
  kind: "free" | "premium"
  format: EventRewardFormat
  testIdPrefix?: string
  /** A note under the chain (what its rewards do, what it needs). */
  children?: ReactNode
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
  const each = missions.every((mission) =>
    same(mission.rewards, missions[0]?.rewards ?? [])
  )
    ? missions[0]?.rewards
    : null
  const last = missions.length
  const firstTask = missions[0]?.tasks[0]
  const oneTask =
    firstTask !== undefined &&
    missions.every(
      (mission) =>
        mission.tasks.length === 1 &&
        mission.tasks[0] !== undefined &&
        text.taskName(mission.tasks[0]) === text.taskName(firstTask)
    )

  return (
    <RewardPanel
      className="bg-background"
      label={t("rewards.chainLabel", {
        kind: t(`rewards.${kind}`),
        count: last,
      })}
      note={<RewardText format={format} rewards={sumRewards(missions)} />}
      testId={`${testIdPrefix}-chain-${chain.id}`}
    >
      {oneTask ? (
        <>
          <p className="text-sm font-semibold">{taskNames.join(" · ")}</p>
          <div aria-hidden="true" className="flex h-12 items-end gap-0.5">
            {missions.map((mission, index) => {
              const target = mission.tasks[0]?.target ?? 0
              return (
                <Tooltip key={mission.id}>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "min-h-1.5 flex-1 rounded-t-sm",
                        kind === "premium" ? "bg-amber-500" : "bg-primary"
                      )}
                      style={{
                        height: `${Math.round((target / highest) * 100)}%`,
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{`${index + 1}: ${format.number(target)}`}</TooltipContent>
                </Tooltip>
              )
            })}
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
        </>
      ) : (
        <ol
          className="flex flex-col divide-y text-sm"
          data-testid={`${testIdPrefix}-chain-steps`}
        >
          {missions.map((mission, index) => (
            <li className="flex gap-2 py-1.5" key={mission.id}>
              <span className="w-6 shrink-0 text-right text-muted-foreground tabular-nums">
                {index + 1}
              </span>
              <span>
                {mission.tasks.map((task) => text.task(task)).join(" · ")}
              </span>
            </li>
          ))}
        </ol>
      )}
      {each ? (
        <RewardText format={format} rewards={each} suffix={t("rewards.each")} />
      ) : null}
      {children}
      {/* Every mission in words for assistive tech; the bars show the same. */}
      {oneTask ? (
        <ol className="sr-only">
          {missions.map((mission, index) => (
            <li key={mission.id}>
              {t("rewards.position", { position: index + 1, length: last })}:{" "}
              {mission.tasks.map((task) => text.task(task)).join(", ")}
            </li>
          ))}
        </ol>
      ) : null}
    </RewardPanel>
  )
}

/** The daily missions as tiles (a list on a phone), with what they pay a day in the heading. */
export function DailyMissions({
  missions,
  format,
  phone,
  empty,
  testIdPrefix = "event-shop",
}: {
  missions: readonly GameCatalogEventShopMission[]
  format: EventRewardFormat
  phone: boolean
  /** Shown when there is no daily mission. */
  empty: string
  testIdPrefix?: string
}) {
  const { t } = useTranslation("eventShops")
  const text = useTaskText()
  return (
    <RewardPanel
      label={t("rewards.dailyLabel", { count: missions.length })}
      note={
        missions.length > 0 ? (
          <RewardText
            format={format}
            rewards={sumRewards(missions)}
            suffix={t("rewards.aDay")}
          />
        ) : undefined
      }
      testId={`${testIdPrefix}-daily-missions`}
    >
      {missions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul
          className={cn(
            phone
              ? "flex flex-col divide-y"
              : "grid grid-cols-2 gap-1.5 lg:grid-cols-3"
          )}
        >
          {missions.map((mission) => (
            <li
              key={mission.id}
              className={cn(
                "flex min-w-0 gap-1",
                phone
                  ? "items-center justify-between py-2"
                  : "flex-col rounded-md border p-2"
              )}
              data-testid={`${testIdPrefix}-mission-${mission.id}`}
            >
              <span className="text-sm font-medium">
                {mission.tasks.map((task) => text.task(task)).join(", ")}
              </span>
              <RewardText format={format} rewards={mission.rewards} />
            </li>
          ))}
        </ul>
      )}
    </RewardPanel>
  )
}
