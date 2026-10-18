import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import {
  useMissionLabel,
  type LegendaryEvent,
  type LegendaryEventMissionRef,
} from "@/entities/legendary-event"

import type { MissionAlternative } from "../lib/token-missions"
import type { MarkTokenHandler } from "./next-token-card"
import { TokenMarkButtons } from "./token-mark-buttons"
import { TokenObjectives } from "./token-objectives"

/** "Progresses: …" naming the missions a token progresses; nothing when it progresses none. */
export function MissionsProgressed({
  missions,
  testId,
}: {
  missions: readonly LegendaryEventMissionRef[]
  testId: string
}) {
  const { t } = useTranslation("legendaryEvents")
  const missionLabel = useMissionLabel()
  if (missions.length === 0) return null
  return (
    <p className="text-xs" data-testid={testId}>
      <span className="font-medium">
        {t("tokenPlan.nextToken.missions.progresses")}
      </span>{" "}
      {missions
        .map((entry) =>
          entry.track === "premium"
            ? t("tokenPlan.nextToken.missions.premium", {
                mission: missionLabel(entry.mission),
              })
            : missionLabel(entry.mission)
        )
        .join(" · ")}
    </p>
  )
}

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
            {t("tokenPlan.nextToken.battle", {
              lane,
              battle: token.battleIndex + 1,
            })}
          </span>
          <span
            className="tabular-nums"
            data-testid="next-token-missions-points"
          >
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
        <MissionsProgressed
          missions={missions}
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
