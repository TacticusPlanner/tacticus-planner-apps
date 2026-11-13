import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
  CampaignGroupedList,
  flattenTodayLocations,
  LocationRow,
  selectTodayRaids,
  useDailyRaids,
  type RaidLocationTarget,
} from "@/features/daily-raids"
import { CampaignBattleDialog } from "@/widgets/battle-preview"

/** Home dashboard's Daily Raids widget: today's real (energy-budget) schedule for the account's Active
 * goals in global order (the same run as Today) — or, once today's real energy spend reaches the daily
 * limit, the Bonus Raids that Today then lists alone (`selectTodayRaids`) — flattened to one row per battle location regardless
 * of which goal it's for, with already-raided/exhausted locations excluded (home-raids-widget spec).
 * The list shows the first five locations, one per row,, expandable in place; the header link opens the full Today page. */
const VISIBLE_LOCATIONS = 5

export function RaidsWidget() {
  const { t } = useTranslation("common")
  const raids = useDailyRaids()
  const [expanded, setExpanded] = useState(false)
  // The location whose battle and enemies are open (tapping its name).
  const [shownLocation, setShownLocation] = useState<RaidLocationTarget | null>(
    null
  )

  const body = (() => {
    if (raids.status === "loading") {
      return (
        <div className="flex flex-col gap-2" data-testid="home-raids-loading">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      )
    }
    if (raids.status === "no-goals") {
      return (
        <p
          className="text-sm text-muted-foreground"
          data-testid="home-raids-no-goals"
        >
          {t("home.raids.noGoals")}
        </p>
      )
    }
    if (raids.status === "error") {
      return (
        <p
          className="text-sm text-destructive"
          data-testid="home-raids-schedule-error"
        >
          {t("home.raids.error")}
        </p>
      )
    }
    if (raids.status === "no-farmable") {
      return (
        <p
          className="text-sm text-muted-foreground"
          data-testid="home-raids-empty"
        >
          {t("home.raids.empty")}
        </p>
      )
    }

    const selection = selectTodayRaids({
      todayEntries: raids.today.entries,
      bonusEntries: raids.bonus.entries,
      raidsLeftTodayEntries: raids.raidsLeftToday.entries,
      attemptsLeftByBattle: raids.attemptsLeftByBattle,
      dailyEnergy: raids.dailyEnergy,
      realEnergyUsedToday: raids.realEnergyUsedToday,
    })
    // Mirrors Today: once the daily energy limit is spent, Bonus Raids are the only list.
    const locations = flattenTodayLocations(
      selection.energyLimitReached
        ? selection.bonusEntries
        : selection.planEntries,
      raids.attemptsLeftByBattle
    )
    const limitCaption = selection.energyLimitReached ? (
      <p
        className="text-sm text-muted-foreground"
        data-testid="home-raids-energy-limit-reached"
      >
        {t("home.raids.limitReached")}
      </p>
    ) : null
    if (locations.length === 0) {
      return (
        <div className="flex flex-col gap-2">
          {limitCaption}
          <p
            className="text-sm text-muted-foreground"
            data-testid="home-raids-empty"
          >
            {t("home.raids.empty")}
          </p>
        </div>
      )
    }

    const hiddenCount = expanded
      ? 0
      : Math.max(0, locations.length - VISIBLE_LOCATIONS)
    const shown = expanded ? locations : locations.slice(0, VISIBLE_LOCATIONS)
    const list = (
      <div className="flex flex-col gap-2">
        <CampaignGroupedList
          battleIdOf={(entry) => entry.battleId}
          locationsByBattleId={raids.locationsByBattleId}
          rows={shown}
          testId="home-raids-list"
          renderRow={(entry) => (
            <LocationRow
              entry={entry}
              key={entry.battleId}
              location={raids.locationsByBattleId.get(entry.battleId)}
              onShowLocation={setShownLocation}
              progress={raids.resourceTotals.get(entry.resourceId)}
              resourceLabel={
                raids.resourceLabels.get(entry.resourceId) ?? entry.resourceId
              }
              resourceVisual={raids.resourceVisuals.get(entry.resourceId)}
            />
          )}
        />
        {locations.length > VISIBLE_LOCATIONS ? (
          <Button
            aria-expanded={expanded}
            className="self-start"
            data-testid="home-raids-toggle"
            onClick={() => setExpanded((value) => !value)}
            size="sm"
            variant="ghost"
          >
            {expanded
              ? t("home.raids.showLess")
              : t("home.raids.showMore", { count: hiddenCount })}
          </Button>
        ) : null}
      </div>
    )
    if (!limitCaption) return list
    return (
      <div className="flex flex-col gap-2">
        {limitCaption}
        {list}
      </div>
    )
  })()

  return (
    <Card className="h-full" data-testid="home-raids-widget" id="home-raids">
      <CardHeader>
        <CardTitle>{t("home.raids.title")}</CardTitle>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link data-testid="home-raids-open-today" to="/dailies/raids">
              {t("home.raids.openToday")}
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>{body}</CardContent>
      <CampaignBattleDialog
        onClose={() => setShownLocation(null)}
        target={shownLocation}
      />
    </Card>
  )
}
