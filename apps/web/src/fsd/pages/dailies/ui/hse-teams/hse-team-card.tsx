import { useTranslation } from "react-i18next"
import { onslaughtAllianceIcon } from "@workspace/game-catalog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { EntityIcon } from "@/shared/ui"

import type { HseTeam, HseTeamMode } from "@/features/team-recommendations"
import { TeamList } from "../team-recs/team-list"
import { TrackShortfall } from "../team-recs/track-shortfall"
import { hseTeamTestId } from "./hse-team-test-id"

/**
 * One event team: the alliance (or Arena) it is for, how its event units were picked (the Faction
 * Focus faction, or "any unit scores"), the broadened marker when non-event units fill it (for a
 * Faction Focus team: fewer than five of the faction are owned, so no full line-up), and the
 * shared team list with each member's rationale. A team that cannot be built shows the shared
 * insufficient-roster message instead.
 */
export function HseTeamCard({
  mode,
  team,
}: {
  mode: HseTeamMode
  team: HseTeam
}) {
  const { t } = useTranslation(["dailies", "teamRecs", "common", "factions"])
  const testId = hseTeamTestId(mode, team)
  const allianceLabel = team.alliance
    ? t(`common:alliances.${team.alliance}`)
    : null

  if (team.status === "insufficient") {
    return allianceLabel ? (
      <TrackShortfall
        eligible={team.eligible}
        needed={team.needed}
        ownedCount={team.ownedCount}
        testIdPrefix={testId}
        trackLabel={allianceLabel}
      />
    ) : (
      <Card data-testid={`${testId}-insufficient-track`}>
        <CardContent className="py-6 text-sm text-muted-foreground">
          {t("teamRecs:state.noCharacters")}
        </CardContent>
      </Card>
    )
  }

  const { pick, team: category } = team
  const factionName = (factionId: string) =>
    t(`factions:${factionId}`, { defaultValue: factionId })
  const eventUnits = category.members.filter(
    (member) => member.rationale.kind === "event-unit"
  ).length

  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {team.alliance ? (
            <EntityIcon
              alt=""
              className="size-5 shrink-0"
              src={onslaughtAllianceIcon(team.alliance)}
            />
          ) : null}
          {allianceLabel ?? t(`dailies:hse.details.modes.${mode}`)}
        </CardTitle>
        {pick.kind === "faction" ? (
          <CardDescription data-testid={`${testId}-faction`}>
            {t("dailies:hse.teams.faction", {
              faction: factionName(pick.factionId),
            })}
          </CardDescription>
        ) : null}
        {pick.kind === "any-unit" ? (
          <CardDescription data-testid={`${testId}-any-unit`}>
            {t("dailies:hse.teams.anyUnit")}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {category.broadened ? (
          <p
            className="text-xs text-muted-foreground"
            data-testid={`${testId}-broadened`}
          >
            {pick.kind === "faction"
              ? t("dailies:hse.teams.broadenedFaction", {
                  faction: factionName(pick.factionId),
                })
              : eventUnits === 0
                ? t("dailies:hse.teams.broadenedNone")
                : t("dailies:hse.teams.broadened")}
          </p>
        ) : null}
        {category.deliveredSize < category.requestedSize ? (
          <p
            className="text-xs text-muted-foreground"
            data-testid={`${testId}-shortfall`}
          >
            {t("teamRecs:category.fewerThanRequested", {
              delivered: category.deliveredSize,
              requested: category.requestedSize,
            })}
          </p>
        ) : null}
        <TeamList
          members={category.members}
          testId={`${testId}-members`}
          testIdPrefix={testId}
        />
      </CardContent>
    </Card>
  )
}
