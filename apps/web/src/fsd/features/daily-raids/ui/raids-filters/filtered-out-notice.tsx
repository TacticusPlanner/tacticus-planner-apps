import { useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { FunnelX } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import type {
  DailyRaidGoalViewModel,
  DailyRaidsReadyViewModel,
} from "../../model/daily-raids.domain"
import { groupFilteredOutByMaterial } from "../../model/raids-filters/filtered-out-materials"
import { emptyRaidsFilters } from "../../model/raids-filters/raids-filters.domain"
import { useRaidsFilters } from "../../model/raids-filters/use-raids-filters"
import { EventGoalIcons } from "../home-screen-event/event-goal-icons"
import { ResourceIconWithTooltip } from "../resource-icon"
import { ResourceStock } from "../resource-stock"

/** Materials listed before "Show all": keeps the notice compact above Today's raids. */
const VISIBLE_MATERIALS = 5

/**
 * Explains materials the applied Raids Filters left without an allowed node, with a one-tap Reset.
 * Lists each material with the player's have/need and the goals waiting on it (V1's blocked
 * upgrades list), and links to Insights for what no node drops at all. Auto-picked materials and
 * goals pinned to an excluded location are worded separately, because a pinned goal looks like a
 * bug ("I pinned that node") unless the pin is named as the cause.
 */
export function FilteredOutNotice({
  raids,
}: {
  raids: DailyRaidsReadyViewModel
}) {
  const { t } = useTranslation("dailies")
  const [, setFilters] = useRaidsFilters()
  const [showAll, setShowAll] = useState(false)
  const { filteredOut } = raids
  const materials = new Set(
    filteredOut.filter((need) => !need.pinned).map((need) => need.resourceId)
  ).size
  const pinnedGoals = new Set(
    filteredOut.filter((need) => need.pinned).map((need) => need.goalId)
  ).size
  if (materials === 0 && pinnedGoals === 0) return null

  const rows = groupFilteredOutByMaterial(filteredOut)
  const shownRows = showAll ? rows : rows.slice(0, VISIBLE_MATERIALS)
  const goalsOf = (goalIds: readonly string[]) =>
    goalIds
      .map((goalId) => raids.goalsById.get(goalId))
      .filter((goal): goal is DailyRaidGoalViewModel => goal !== undefined)

  return (
    <Alert data-testid="raids-filters-filtered-out">
      <FunnelX aria-hidden="true" />
      <AlertTitle>{t("raidsFilters.filteredOut.title")}</AlertTitle>
      <AlertDescription className="min-w-0 space-y-2">
        {materials > 0 ? (
          <p data-testid="raids-filters-filtered-out-materials">
            {t("raidsFilters.filteredOut.materials", { count: materials })}
          </p>
        ) : null}
        {pinnedGoals > 0 ? (
          <p data-testid="raids-filters-filtered-out-pinned">
            {t("raidsFilters.filteredOut.pinned", { count: pinnedGoals })}
          </p>
        ) : null}
        <ul
          aria-label={t("raidsFilters.filteredOut.listLabel")}
          className="w-full space-y-1"
        >
          {shownRows.map((row) => {
            const label =
              raids.resourceLabels.get(row.resourceId) ?? row.resourceId
            return (
              <li
                className="flex min-w-0 items-center gap-2"
                key={row.resourceId}
              >
                <ResourceIconWithTooltip
                  size="icon-lg"
                  label={label}
                  visual={raids.resourceVisuals.get(row.resourceId)}
                />
                <span className="min-w-0 truncate text-foreground">
                  {label}
                </span>
                <ResourceStock
                  progress={raids.resourceTotals.get(row.resourceId)}
                  testId={`raids-filters-filtered-out-stock-${row.resourceId}`}
                />
                {row.pinned ? (
                  <Badge variant="outline">
                    {t("raidsFilters.filteredOut.pinnedBadge")}
                  </Badge>
                ) : null}
                <span className="ml-auto">
                  <EventGoalIcons
                    goals={goalsOf(row.goalIds)}
                    testId={`raids-filters-filtered-out-goals-${row.resourceId}`}
                  />
                </span>
              </li>
            )
          })}
        </ul>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            data-testid="raids-filters-filtered-out-reset"
            onClick={() => setFilters(emptyRaidsFilters)}
            size="sm"
            variant="outline"
          >
            {t("raidsFilters.filteredOut.reset")}
          </Button>
          {rows.length > VISIBLE_MATERIALS ? (
            <Button
              aria-expanded={showAll}
              onClick={() => setShowAll((shown) => !shown)}
              size="sm"
              variant="ghost"
            >
              {showAll
                ? t("raidsFilters.filteredOut.showLess")
                : t("raidsFilters.filteredOut.showAll", {
                    count: rows.length,
                  })}
            </Button>
          ) : null}
          <Button
            asChild
            className="h-auto px-0 text-left whitespace-normal"
            size="sm"
            variant="link"
          >
            <Link to="/plan/insights">
              {t("raidsFilters.filteredOut.insights")}
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
