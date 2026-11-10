import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { LegendaryEventAnnotationStatus } from "@/entities/legendary-event"

import { tokenMarkIds } from "../lib/token-marks"
import type { PlannedToken } from "../lib/token-plan"
import type { MarkTokenHandler, StopTeamHandler } from "./next-token-card"

/** A shown token's Partly cleared / Couldn't clear actions (`testIdPrefix-partly`,
 *  `testIdPrefix-could-not`), and Stop here (`testIdPrefix-stop`) when `onStopTeam` is given. */
export function TokenMarkButtons({
  token,
  isMobile,
  onMarkToken,
  onStopTeam,
  testIdPrefix,
}: {
  token: PlannedToken
  isMobile: boolean
  onMarkToken: MarkTokenHandler
  onStopTeam?: StopTeamHandler
  testIdPrefix: string
}) {
  const { t } = useTranslation("legendaryEvents")
  const labels = {
    team: token.teamName,
    lane: t(`lanes.${token.laneId}`),
    battle: token.battleIndex + 1,
    previous: token.battleIndex,
  }
  const mark = (status: LegendaryEventAnnotationStatus) =>
    onMarkToken(
      token.laneId,
      token.battleIndex,
      tokenMarkIds(token.clearedIds, status),
      status,
      token.teamId
    )
  return (
    <div
      className={cn("flex gap-2", isMobile ? "flex-col" : "shrink-0 flex-row")}
    >
      <Button
        aria-label={t("tokenPlan.nextToken.actions.partlyLabel", labels)}
        className={cn(isMobile && "h-11 w-full")}
        data-testid={`${testIdPrefix}-partly`}
        onClick={() => mark("maybeClear")}
        type="button"
        variant="outline"
      >
        {t("tokenPlan.nextToken.actions.partly")}
      </Button>
      <Button
        aria-label={t("tokenPlan.nextToken.actions.couldNotLabel", labels)}
        className={cn(isMobile && "h-11 w-full")}
        data-testid={`${testIdPrefix}-could-not`}
        onClick={() => mark("stopHere")}
        type="button"
        variant="outline"
      >
        {t("tokenPlan.nextToken.actions.couldNot")}
      </Button>
      {onStopTeam ? (
        <Button
          aria-label={t("tokenPlan.nextToken.actions.stopLabel", labels)}
          className={cn(isMobile && "h-11 w-full")}
          data-testid={`${testIdPrefix}-stop`}
          onClick={() =>
            onStopTeam(token.laneId, token.battleIndex, token.teamId)
          }
          title={t("tokenPlan.nextToken.actions.stopHint", labels)}
          type="button"
          variant="outline"
        >
          {t("tokenPlan.nextToken.actions.stop")}
        </Button>
      ) : null}
    </div>
  )
}
