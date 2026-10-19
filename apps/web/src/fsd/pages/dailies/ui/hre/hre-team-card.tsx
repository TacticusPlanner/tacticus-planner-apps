import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { HRE_TEAM_SIZE } from "../../model/hre-team-recommendations"
import type { HreTeamViewModel } from "../../model/use-hre-team-recommendations"
import { TeamList } from "../team-recs/team-list"
import { TeamRecsState } from "../team-recs/team-recs-state"

/**
 * The HRE mission team for the current mission's lineup objective: the strongest all-alliance,
 * summon-free or featured-hero-led team, with a note when the alliance has fewer than five units,
 * or why there is no team (too few units, the featured hero still locked).
 */
export function HreTeamCard({
  view,
  alliance,
  hero,
}: {
  view: HreTeamViewModel
  /** The featured hero's localized alliance, or null when the hero does not resolve. */
  alliance: string | null
  hero: string
}) {
  const { t } = useTranslation(["hre", "teamRecs"])
  if (view.status === "hidden") return null

  return (
    <Card data-testid="hre-team">
      <CardHeader>
        <CardTitle>{t("hre:teams.title")}</CardTitle>
        {view.status === "ready" && view.team.status !== "locked-hero" ? (
          <CardDescription data-testid="hre-team-rule">
            {view.team.rule === "alliance"
              ? alliance
                ? t("hre:teams.alliance", { alliance })
                : t("hre:teams.allianceGeneric")
              : view.team.rule === "summonFree"
                ? t("hre:teams.summonFree")
                : t("hre:teams.featured", { hero })}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {view.status === "loading" ? (
          <TeamRecsState state="loading" testIdPrefix="hre-team" />
        ) : view.status === "error" ? (
          <TeamRecsState
            onRetry={view.retry}
            state="error"
            testIdPrefix="hre-team"
          />
        ) : view.team.status === "locked-hero" ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="hre-team-locked-hero"
          >
            {t("hre:teams.lockedHero", { hero })}
          </p>
        ) : view.team.status === "insufficient" ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="hre-team-too-few"
          >
            {t("hre:teams.tooFew")}
          </p>
        ) : (
          <>
            {view.team.rule === "alliance" &&
            view.team.eligibleCount < HRE_TEAM_SIZE ? (
              <p
                className="text-xs text-muted-foreground"
                data-testid="hre-team-few"
              >
                {t("hre:teams.fewAlliance", {
                  count: view.team.eligibleCount,
                  alliance: alliance ?? "",
                })}
              </p>
            ) : null}
            <TeamList
              members={view.team.team.members}
              testId="hre-team-members"
              testIdPrefix="hre-team"
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
