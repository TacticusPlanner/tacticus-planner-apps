import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import {
  AnnotationMarkIcon,
  type LegendaryEventAnnotationStatus,
} from "@/entities/legendary-event"

import { tokenMarkIds } from "../lib/token-marks"
import type { PlannedToken } from "../lib/token-plan"
import type { MarkTokenHandler, StopTeamHandler } from "./next-token-card"

/** A shown token's Maybe clear / Stop here actions (`testIdPrefix-partly`, `testIdPrefix-could-not`),
 *  each named after the mark it sets with its icon and a line on what it means, and Try another
 *  team (`testIdPrefix-stop`) when `onStopTeam` is given. */
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
      <ActionButton
        ariaLabel={t("tokenPlan.nextToken.actions.maybeLabel", labels)}
        hint={t("tokenPlan.nextToken.actions.maybeHint")}
        icon={<AnnotationMarkIcon status="maybeClear" />}
        isMobile={isMobile}
        onClick={() => mark("maybeClear")}
        testId={`${testIdPrefix}-partly`}
      >
        {t("tokenPlan.nextToken.actions.maybe")}
      </ActionButton>
      <ActionButton
        ariaLabel={t("tokenPlan.nextToken.actions.stopHereLabel", labels)}
        hint={t("tokenPlan.nextToken.actions.stopHereHint")}
        icon={<AnnotationMarkIcon status="stopHere" />}
        isMobile={isMobile}
        onClick={() => mark("stopHere")}
        testId={`${testIdPrefix}-could-not`}
      >
        {t("tokenPlan.nextToken.actions.stopHere")}
      </ActionButton>
      {onStopTeam ? (
        <ActionButton
          ariaLabel={t("tokenPlan.nextToken.actions.stopLabel", labels)}
          hint={t("tokenPlan.nextToken.actions.stopHint", labels)}
          isMobile={isMobile}
          onClick={() =>
            onStopTeam(token.laneId, token.battleIndex, token.teamId)
          }
          testId={`${testIdPrefix}-stop`}
        >
          {t("tokenPlan.nextToken.actions.stop")}
        </ActionButton>
      ) : null}
    </div>
  )
}

/** An outline action: its name (after an optional icon) over a short muted line. */
function ActionButton({
  ariaLabel,
  hint,
  icon,
  isMobile,
  onClick,
  testId,
  children,
}: {
  ariaLabel: string
  hint: string
  icon?: ReactNode
  isMobile: boolean
  onClick: () => void
  testId: string
  children: ReactNode
}) {
  return (
    <Button
      aria-label={ariaLabel}
      className={cn(
        "h-auto flex-col items-start gap-0 py-1.5 text-left",
        isMobile && "min-h-11 w-full"
      )}
      data-testid={testId}
      onClick={onClick}
      type="button"
      variant="outline"
    >
      <span className="flex items-center gap-1.5">
        {icon}
        {children}
      </span>
      <span className="text-xs font-normal text-muted-foreground">{hint}</span>
    </Button>
  )
}
