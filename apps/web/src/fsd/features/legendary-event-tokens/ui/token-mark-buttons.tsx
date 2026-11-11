import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { LegendaryEventAnnotationStatus } from "@/entities/legendary-event"

import { tokenMarkIds } from "../lib/token-marks"
import type { PlannedToken } from "../lib/token-plan"
import type { MarkTokenHandler } from "./next-token-card"

/** A shown token's Maybe clear (`testIdPrefix-maybe`) and Stop here (`testIdPrefix-stop`)
 *  actions, each named after the mark it sets with a short line on what it means. */
export function TokenMarkButtons({
  token,
  isMobile,
  onMarkToken,
  testIdPrefix,
}: {
  token: PlannedToken
  isMobile: boolean
  onMarkToken: MarkTokenHandler
  testIdPrefix: string
}) {
  const { t } = useTranslation("legendaryEvents")
  const labels = {
    team: token.teamName,
    lane: t(`lanes.${token.laneId}`),
    battle: token.battleIndex + 1,
  }
  const mark = (status: LegendaryEventAnnotationStatus) =>
    onMarkToken(
      token.laneId,
      token.battleIndex,
      tokenMarkIds(token.clearedIds, status),
      status,
      token.teamId
    )
  const actions = [
    { status: "maybeClear", key: "maybe" },
    { status: "stopHere", key: "stop" },
  ] as const
  return (
    <div
      className={cn("flex gap-2", isMobile ? "flex-col" : "shrink-0 flex-row")}
    >
      {actions.map(({ status, key }) => (
        <Button
          aria-label={t(`tokenPlan.nextToken.actions.${key}Label`, labels)}
          className={cn(
            "h-auto flex-col items-start gap-0 py-1.5 text-left",
            isMobile && "min-h-11 w-full"
          )}
          data-testid={`${testIdPrefix}-${key}`}
          key={status}
          onClick={() => mark(status)}
          type="button"
          variant="outline"
        >
          <span>{t(`tokenPlan.nextToken.actions.${key}`)}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {t(`tokenPlan.nextToken.actions.${key}Hint`)}
          </span>
        </Button>
      ))}
    </div>
  )
}
