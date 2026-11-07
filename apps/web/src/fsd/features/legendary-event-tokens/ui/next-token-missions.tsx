import { useTranslation } from "react-i18next"
import { legendaryEventResourceIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import type { LegendaryEvent } from "@/entities/legendary-event"
import { EntityIcon } from "@/shared/ui"

import { gainsFromProgress } from "../lib/mission-gains"
import type { MissionAlternative } from "../lib/token-missions"
import { BattleInfoButton } from "./battle-info"
import type { MarkTokenHandler } from "./next-token-card"
import { TokenMarkButtons } from "./token-mark-buttons"
import { TokenObjectives } from "./token-objectives"
import { TokenMissionsPopover } from "./token-popovers"

/**
 * The Next token card's For missions entry (spec: For missions alternative): a playable planned
 * token progressing more open missions than the Next token, with the points it gives up and the
 * same Partly cleared / Couldn't clear actions.
 */
export function MissionAlternativeView({
  event,
  alternative,
  isMobile,
  onMarkToken,
}: {
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  alternative: MissionAlternative
  isMobile: boolean
  /** Absent while marks cannot be written or the token is for a later run. */
  onMarkToken: MarkTokenHandler | undefined
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const { token, missions, pointsDifference } = alternative
  const lane = t(`lanes.${token.laneId}`)
  return (
    <section
      aria-labelledby="next-token-missions-title"
      className={cn(
        "flex min-w-0 flex-col gap-2 border-t pt-3",
        !isMobile && "md:flex-row md:items-center md:gap-4"
      )}
      data-battle={token.battleIndex}
      data-lane={token.laneId}
      data-team={token.teamId}
      data-testid="next-token-missions-alternative"
    >
      <div className="flex min-w-0 flex-col gap-1 md:flex-1">
        <h3 className="text-sm font-semibold" id="next-token-missions-title">
          {t("tokenPlan.nextToken.missions.title")}
        </h3>
        <div className="flex flex-wrap items-baseline gap-x-3 text-sm">
          <span className="font-medium" data-testid="next-token-missions-team">
            {token.teamName}
          </span>
          <span data-testid="next-token-missions-battle">
            <BattleInfoButton
              battleIndex={token.battleIndex}
              laneId={token.laneId}
            >
              {t("tokenPlan.nextToken.battle", {
                lane,
                battle: token.battleIndex + 1,
              })}
            </BattleInfoButton>
          </span>
          <span
            className="inline-flex items-center gap-1 tabular-nums"
            data-testid="next-token-missions-points"
          >
            <EntityIcon
              alt=""
              className="size-3.5 shrink-0"
              src={legendaryEventResourceIcon("points")}
            />
            {t("tokenPlan.nextToken.missions.points", {
              points: number.format(token.points),
              difference: number.format(pointsDifference),
            })}
          </span>
        </div>
        <TokenObjectives
          clearedIds={token.clearedIds}
          lane={event[token.laneId]}
        />
        <TokenMissionsPopover
          gains={gainsFromProgress(missions)}
          testId="next-token-missions-progresses"
        />
      </div>
      {onMarkToken ? (
        <TokenMarkButtons
          isMobile={isMobile}
          onMarkToken={onMarkToken}
          testIdPrefix="next-token-missions"
          token={token}
        />
      ) : null}
    </section>
  )
}
