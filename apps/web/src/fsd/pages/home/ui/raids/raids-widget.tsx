import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
  flattenTodayLocations,
  LocationRow,
  useDailyRaids,
} from "@/features/daily-raids"

/** Home dashboard's Daily Raids widget: today's real (energy-budget) schedule for the account's Active
 * goals in global order (the same run as Today), flattened to one row per battle location regardless
 * of which goal it's for, with already-raided/exhausted locations excluded (home-raids-widget spec).
 * Activating the widget opens the full Today page. */
export function RaidsWidget() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const raids = useDailyRaids()

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

    const locations = flattenTodayLocations(
      raids.today.entries,
      raids.attemptsLeftByBattle
    )
    if (locations.length === 0) {
      return (
        <p
          className="text-sm text-muted-foreground"
          data-testid="home-raids-empty"
        >
          {t("home.raids.empty")}
        </p>
      )
    }

    return (
      <div
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        data-testid="home-raids-list"
      >
        {locations.map((entry) => (
          <LocationRow
            entry={entry}
            key={entry.battleId}
            location={raids.locationsByBattleId.get(entry.battleId)}
            resourceLabel={
              raids.resourceLabels.get(entry.resourceId) ?? entry.resourceId
            }
            resourceVisual={raids.resourceVisuals.get(entry.resourceId)}
          />
        ))}
      </div>
    )
  })()

  return (
    <Card
      className="cursor-pointer"
      data-testid="home-raids-widget"
      onClick={() => void navigate("/dailies/raids/today")}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          void navigate("/dailies/raids/today")
        }
      }}
    >
      <CardHeader>
        <CardTitle>{t("home.raids.title")}</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
