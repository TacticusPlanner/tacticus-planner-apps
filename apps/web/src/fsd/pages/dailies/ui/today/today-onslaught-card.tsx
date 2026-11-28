import { useTranslation } from "react-i18next"
import { onslaughtTokenIcon } from "@workspace/game-catalog"
import { Badge } from "@workspace/ui/components/badge"

import { OnslaughtRunList } from "@/features/daily-raids"
import { EntityIcon } from "@/shared/ui"

import { TodayCard } from "./today-card"
import type { TodayView } from "../../model/today/today-view-model"

/** In-page anchor of the Onslaught card, the Onslaught glance tile's target. */
export const TODAY_ONSLAUGHT_ID = "today-onslaught"

/** Today's Onslaught runs per unit, in goal priority, with the whole tokens to spend. */
export function TodayOnslaughtCard({ view }: { view: TodayView }) {
  const { t } = useTranslation("dailies")

  return (
    <TodayCard
      action={
        <Badge aria-hidden="true" className="gap-1.5" variant="secondary">
          <EntityIcon size="icon" alt="" src={onslaughtTokenIcon()} />
          <span className="tabular-nums">{view.onslaughtTokens}</span>
        </Badge>
      }
      className="scroll-mt-[calc(var(--mobile-header-height)+1rem)] md:scroll-mt-4"
      id={TODAY_ONSLAUGHT_ID}
      testId="today-onslaught"
      title={t("plan.onslaught")}
    >
      <p className="sr-only">
        {t("today.onslaughtSummary", { runs: view.onslaughtTokens })}
      </p>
      <OnslaughtRunList
        rowTestId={(unitId) => `today-onslaught-${unitId}`}
        runs={view.onslaughtRuns}
        testId="today-onslaught-list"
      />
    </TodayCard>
  )
}
