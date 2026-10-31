import type { BattleId } from "@workspace/game-domain"
import { useTranslation } from "react-i18next"

import {
  FilteredOutNotice,
  RaidSchedule,
  RaidState,
  type DailyRaidsViewModel,
} from "@/features/daily-raids"

import { TodayCard } from "./today-card"
import type { TodayView } from "./today-view-model"

// Resource cards inside a card read as items one step darker than the card around them.
export const INSET_CARDS_CLASS_NAME = "[&_[data-slot=card]]:bg-background"

/**
 * Today's plan: the raids the daily energy covers, goal by goal. While the raids load or fail, it
 * holds that state, so the dashboard keeps its shape.
 */
export function TodayPlanCard({
  onCantRaid,
  raids,
  view,
}: {
  onCantRaid?: (battleId: BattleId) => void
  raids: DailyRaidsViewModel
  view: TodayView | undefined
}) {
  const { t } = useTranslation("dailies")

  return (
    <TodayCard
      meta={
        view && view.planNodeCount > 0
          ? t("today.planMeta", { count: view.planNodeCount })
          : undefined
      }
      title={t("today.plan")}
      titleClassName="text-lg"
    >
      {raids.status !== "ready" ? (
        <RaidState state={raids.status} variant="inline" />
      ) : (
        <>
          <FilteredOutNotice filteredOut={raids.filteredOut} />
          {view && view.planNodeCount > 0 ? (
            <div className={INSET_CARDS_CLASS_NAME}>
              <RaidSchedule
                {...view.scheduleProps}
                entries={view.selection.planEntries}
                onCantRaid={onCantRaid}
                testId="today-raid-list"
              />
            </div>
          ) : (
            <RaidState state="no-farmable" variant="inline" />
          )}
        </>
      )}
    </TodayCard>
  )
}
