import { useTranslation } from "react-i18next"

import type { TeamCardViewModel } from "./teams.view-model"

/** The points the team has left over its depth, or "—" with "Set depth to see points left" when
 *  it has no depth (spec: a team card shows the points it has left within its depth). */
export function PointsLeft({
  card,
  format,
}: {
  card: Pick<TeamCardViewModel, "pointsLeft" | "displayedDepth">
  format: (value: number) => string
}) {
  const { t } = useTranslation("legendaryEvents")
  if (card.pointsLeft === null || card.displayedDepth === null) {
    return (
      <span
        className="whitespace-nowrap text-muted-foreground"
        data-testid="team-card-points"
        title={t("teams.pointsLeftNeedsDepth")}
      >
        <span aria-hidden>—</span>
        <span className="sr-only">{t("teams.pointsLeftNeedsDepth")}</span>
      </span>
    )
  }
  return (
    <span className="whitespace-nowrap" data-testid="team-card-points">
      {t("teams.pointsLeft", {
        points: format(card.pointsLeft),
        depth: card.displayedDepth,
      })}
    </span>
  )
}

/** The team's summed power beside the points left: a placeholder dash while the power data
 *  loads, "—" with the reason for screen readers when the roster is not synced or the power data
 *  is unavailable. */
export function TeamPower({
  card,
  format,
}: {
  card: Pick<TeamCardViewModel, "teamPower" | "teamPowerStatus">
  format: (value: number) => string
}) {
  const { t } = useTranslation("legendaryEvents")
  const state = card.teamPowerStatus
  const reason =
    state === "noRoster"
      ? t("teams.power.noRoster")
      : state === "unavailable"
        ? t("teams.power.unavailable")
        : undefined
  return (
    <span
      className="whitespace-nowrap text-muted-foreground"
      data-state={state}
      data-testid="team-card-power"
      title={reason}
    >
      {t("teams.power.label")}{" "}
      {card.teamPower === null ? (
        <>
          <span aria-hidden className="text-foreground">
            —
          </span>
          {reason ? <span className="sr-only">{reason}</span> : null}
        </>
      ) : (
        <span className="text-foreground">{format(card.teamPower)}</span>
      )}
    </span>
  )
}
