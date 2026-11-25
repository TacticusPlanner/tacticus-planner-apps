import type { BattleId } from "@workspace/game-domain"
import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"

import { FilteredOutNotice } from "@/features/daily-raids"
import type { DailyRaidsViewModel } from "@/features/daily-raids"
import {
  CampaignBattleDialogHost,
  useCampaignBattleDialog,
} from "@/widgets/battle-preview"

import { useTodayShopRecommendations } from "../today-shop-recommendations"
import { TodayShops } from "../today-shops"
import { shopsGlanceOf } from "./shops-glance"
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
  // The planned location whose battle and enemies are open (tapping its name).
  // The battle dialog's open state lives outside this page, so a location's info button
  // re-renders only the dialog.
  const battleDialog = useCampaignBattleDialog()
  // One read for the Shops card and its glance tile.
  const shopRecommendations = useTodayShopRecommendations()
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
            <FilteredOutNotice raids={raids} />
          ) : undefined
        }
        onShowLess={() => setBonusShownCount(BONUS_LIMIT)}
        onShowMore={() => setBonusShownCount((shown) => shown + BONUS_STEP)}
        onShowLocation={battleDialog.show}
        view={view}
        wide={wide}
      />
    ) : null

  return (
    <div className="@container min-w-0 space-y-3.5" data-testid="today-page">
      <TodayGlance shops={shopsGlanceOf(shopRecommendations)} view={view} />
      <div
        className={cn(
          "grid items-start gap-3.5",
          "@2xl:grid-cols-2",
          "@[84rem]:grid-cols-4"
        )}
        data-testid="today-grid"
      >
        <div className="min-w-0 @2xl:col-span-2" data-testid="today-plan-area">
          {bonusInPlanArea ? (
            bonusCard(true)
          ) : (
            <TodayPlanCard
              onCantRaid={onCantRaid}
              onShowLocation={battleDialog.show}
              raids={raids}
              view={view}
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-3.5">
          {bonusBeside ? bonusCard(false) : null}
          {/* On one track Shops sits below the plan card, which grows when the plan arrives and
              would push Shops down the screen (layout shift), so there it waits for the plan. Side
              by side (two or four tracks) it shows while the plan loads. */}
          <div
            className={cn(raids.status === "loading" && "hidden @2xl:block")}
            data-testid="today-shops-slot"
          >
            <TodayShops recommendations={shopRecommendations} />
          </div>
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
      <CampaignBattleDialogHost dialog={battleDialog} />
    </div>
  )
}
