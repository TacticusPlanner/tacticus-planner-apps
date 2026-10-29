import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { RaidSchedule } from "@/features/daily-raids"

import { TodayCard } from "./today-card"
import { INSET_CARDS_CLASS_NAME } from "./today-plan-card"
import type { TodayView } from "./today-view-model"

/**
 * Bonus raids. Below the daily energy limit it sits next to the plan with the top 3 entries and a
 * Show more / Show less toggle. At the limit it takes the plan's place, opens with the limit caption
 * and lists every raid still open today. `notice` (the filtered-out notice) leads the body when the
 * card stands in the plan's place.
 */
export function TodayBonusCard({
  notice,
  onToggleShowAll,
  showAll,
  view,
  wide,
}: {
  notice?: ReactNode
  onToggleShowAll: () => void
  showAll: boolean
  view: TodayView
  wide: boolean
}) {
  const { t } = useTranslation("dailies")
  const atLimit = view.selection.energyLimitReached

  return (
    <TodayCard
      data-limit={atLimit ? "reached" : undefined}
      meta={atLimit ? undefined : t("bonus.meta")}
      title={<span data-testid="bonus-raids-heading">{t("bonus.title")}</span>}
      titleClassName={wide ? "text-lg" : undefined}
    >
      {notice}
      {atLimit ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="bonus-energy-limit-reached"
        >
          {t(
            view.bonusShown.length > 0
              ? "bonus.limitReached"
              : "bonus.limitReachedEmpty"
          )}
        </p>
      ) : null}
      {view.bonusShown.length > 0 ? (
        <div className={INSET_CARDS_CLASS_NAME}>
          <RaidSchedule
            {...view.scheduleProps}
            entries={view.bonusShown}
            testId="bonus-raid-list"
          />
        </div>
      ) : null}
      {view.bonusHasMore ? (
        <Button
          className="self-start"
          variant="outline"
          onClick={onToggleShowAll}
        >
          {t(showAll ? "bonus.showLess" : "bonus.showMore")}
        </Button>
      ) : null}
    </TodayCard>
  )
}
