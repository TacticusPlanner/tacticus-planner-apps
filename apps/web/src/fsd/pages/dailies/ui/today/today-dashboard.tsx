import type { BattleId } from "@workspace/game-domain"
import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"

import {
  FilteredOutNotice,
  type DailyRaidsViewModel,
} from "@/features/daily-raids"

import { TodayShops } from "../today-shops"
import { TodayBonusCard } from "./today-bonus-card"
import { TodayGlance } from "./today-glance"
import { TodayOnslaughtCard } from "./today-onslaught-card"
import { TodayPlanCard } from "./today-plan-card"
import { BONUS_LIMIT, BONUS_STEP, buildTodayView } from "./today-view-model"
import { TodaysAttemptsCard } from "./todays-attempts-card"

/**
 * Today as a dashboard: glance tiles, then a grid of cards whose track count follows the page
 * content's own width (container queries), so an open or collapsed section menu needs no measuring.
 * Four tracks: the plan spans two, then a Bonus raids / Shops stack and an Onslaught / attempts
 * stack. Two tracks: the plan, then the two stacks side by side. One track: everything stacked.
 * DOM order is each column top to bottom, columns left to right, so focus follows what is on screen
 * at every track count.
 */
export function TodayDashboard({
  raids,
  onCantRaid,
}: {
  raids: DailyRaidsViewModel
  /** "Can't raid this?" on a planned location: opens the battle progress dialog. */
  onCantRaid?: (battleId: BattleId) => void
}) {
  const [bonusShownCount, setBonusShownCount] = useState(BONUS_LIMIT)
  const view =
    raids.status === "ready"
      ? buildTodayView(raids, { bonusShownCount })
      : undefined

  // Bonus raids take the plan's place once the energy limit is spent, and whenever the plan shows no
  // node (empty, or every node raided out) but bonus raids are left (as the old lanes showed only
  // Bonus raids then).
  const bonusInPlanArea =
    view !== undefined &&
    (view.selection.energyLimitReached ||
      (view.planNodeCount === 0 && view.selection.bonusEntries.length > 0))
  const bonusBeside =
    view !== undefined &&
    !bonusInPlanArea &&
    view.selection.bonusEntries.length > 0
  const bonusCard = (wide: boolean) =>
    view ? (
      <TodayBonusCard
        notice={
          wide && raids.status === "ready" ? (
            <FilteredOutNotice filteredOut={raids.filteredOut} />
          ) : undefined
        }
        onShowLess={() => setBonusShownCount(BONUS_LIMIT)}
        onShowMore={() => setBonusShownCount((shown) => shown + BONUS_STEP)}
        view={view}
        wide={wide}
      />
    ) : null

  return (
    <div className="@container min-w-0 space-y-3.5" data-testid="today-page">
      <TodayGlance view={view} />
      <div
        className={cn(
          "grid items-start gap-3.5",
          "@[42rem]:grid-cols-2",
          "@[84rem]:grid-cols-4"
        )}
        data-testid="today-grid"
      >
        <div
          className="min-w-0 @[42rem]:col-span-2"
          data-testid="today-plan-area"
        >
          {bonusInPlanArea ? (
            bonusCard(true)
          ) : (
            <TodayPlanCard onCantRaid={onCantRaid} raids={raids} view={view} />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-3.5">
          {bonusBeside ? bonusCard(false) : null}
          <TodayShops />
        </div>
        {raids.status === "ready" && view ? (
          <div className="flex min-w-0 flex-col gap-3.5">
            {view.onslaughtRuns.length > 0 ? (
              <TodayOnslaughtCard view={view} />
            ) : null}
            <TodaysAttemptsCard raids={raids} view={view} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
