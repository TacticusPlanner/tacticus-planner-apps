import { useState } from "react"
import { useTranslation } from "react-i18next"
import { eventDays } from "@workspace/game-catalog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import { Pressable } from "@workspace/ui/components/pressable"

import {
  DailyMissions,
  MissionChainCard,
  RewardLadder,
} from "@/widgets/event-rewards"

import type { EventShopController } from "./use-event-shop-controller"
import type { EventShopFormat } from "./use-event-shop-format"

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
      <RewardLadder
        empty={t("rewards.none")}
        format={format}
        label={t("rewards.milestones")}
        phone={phone}
        testId="event-shop-milestone-ladder"
        tiers={controller.event.milestones}
      />
      <RewardLadder
        empty={t("rewards.none")}
        format={format}
        label={t("rewards.chests", { week: controller.selectedDay.week })}
        phone={phone}
        testId="event-shop-chest-ladder"
        tiers={week?.progressChests ?? []}
      />
    </div>
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
      <DailyMissions
        empty={t("rewards.none")}
        format={format}
        missions={daily}
        phone={phone}
      />
      {chains.length === 0 ? (
        none
      ) : (
        <div
          className={cn("grid gap-3", phone ? "grid-cols-1" : "md:grid-cols-2")}
        >
          {chains.map(({ chain, kind }) => (
            <MissionChainCard
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
          <Pressable
            key={option}
            aria-pressed={view === option}
            className={cn(
              "h-10 flex-1 rounded-lg text-sm font-medium text-muted-foreground",
              view === option && "bg-card text-foreground shadow-sm"
            )}
            data-testid={`event-shop-rewards-${option}`}
            onClick={() => setView(option)}
          >
            {t(`tabs.${option}`)}
          </Pressable>
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
