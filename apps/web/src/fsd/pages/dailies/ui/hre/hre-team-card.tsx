import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { missionName } from "@/features/hre-missions"
import type { HreMission, HreTeamPlan } from "@/entities/hre-mission"

import { HRE_TEAM_SIZE } from "@/features/team-recommendations"
import type { HreTeam, HreTeamViewModel } from "@/features/team-recommendations"
import type { HreTeamHint } from "../../model/hre-team-hints"
import { TeamList } from "../team-recs/team-list"
import { TeamRecsState } from "../team-recs/team-recs-state"

type RuledTeam = Exclude<HreTeam, { status: "locked-hero" }>

/**
 * An HRE mission team for one of the current mission's team plans: the strongest all-alliance,
 * summon-free, ranged, melee, featured-hero-led or any-unit team, titled by where it plays (campaign
 * battles by hand, Arena, Salvage Run, Onslaught, Guild Raid), with notes on the healer, Psychic damage dealers, a running HSE's units and its stat boost, the tokens to keep for a later
 * mission or the spare tokens it plays on, the Arena picks for kills, the Onslaught order for
 * ability uses and the modes that earn no event points, or why there is no team (too few units,
 * the featured hero still locked).
 */
export function HreTeamCard({
  view,
  plan,
  missions,
  tokens,
  alliance,
  hero,
  hseEvent = null,
  testId = "hre-team",
  title,
  note,
  hints = [],
  statBoost = null,
}: {
  view: HreTeamViewModel
  plan:
    | (Pick<HreTeamPlan, "mode" | "reserve" | "preferPsychic"> &
        Partial<Pick<HreTeamPlan, "wholeTrack" | "abilityFocus">>)
    | null
  /** The event's missions, for naming the reserve's mission. */
  missions: readonly HreMission[]
  /** Synced tokens of the plan's mode, or null when unknown. */
  tokens: number | null
  /** The featured hero's localized alliance, or null when the hero does not resolve. */
  alliance: string | null
  hero: string
  /** The running Home Screen Event's name, for the note on its units in the team. */
  hseEvent?: string | null
  /** Distinguishes the cards when a mission has more than one team. */
  testId?: string
  /** Replaces the title by mode (the campaigns a by-hand team can play). */
  title?: string
  /** A hint over the members (some of a by-hand team's nodes deploy fewer units). */
  note?: string | null
  /** The token-mode hints (`hreTeamHints`). */
  hints?: readonly HreTeamHint[]
  /** The running HSE's stat boost in this mode, e.g. Faction Boost's +20% in Arena. */
  statBoost?: { health: number; damage: number; armour: number } | null
}) {
  const { t } = useTranslation(["hre", "teamRecs", "common", "factions"])
  if (view.status === "hidden") return null
  const mode = plan && plan.mode !== "battle" ? plan.mode : null
  const modeName = mode ? t(`hre:tokens.modes.${mode}`) : ""
  const reserve = mode ? plan?.reserve : null

  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle>
          {title ??
            (mode
              ? t("hre:teams.titleMode", { mode: modeName })
              : plan
                ? t("hre:teams.titleBattle")
                : t("hre:teams.title"))}
        </CardTitle>
        {view.status === "ready" && view.team.status !== "locked-hero" ? (
          <CardDescription data-testid="hre-team-rule">
            <RuleText
              alliance={alliance}
              hero={hero}
              team={view.team}
              wholeTrack={plan?.wholeTrack ?? false}
            />
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {reserve ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="hre-team-reserve"
          >
            {t("hre:teams.reserve", {
              count: reserve.tokens,
              mode: modeName,
              mission: missionName(t, reserve.missionNumber, missions),
            })}
            {tokens === null
              ? null
              : ` ${t("hre:teams.reservePlay", {
                  have: tokens,
                  play: Math.max(0, tokens - reserve.tokens),
                })}`}
          </p>
        ) : null}
        {note ? (
          <p
            className="text-xs text-muted-foreground"
            data-testid="hre-team-note"
          >
            {note}
          </p>
        ) : null}
        {hints.map((hint) => (
          <p
            className="text-sm text-muted-foreground"
            data-testid={`hre-team-hint-${hint.key}`}
            key={hint.key}
          >
            {hint.key === "spare"
              ? t("hre:teams.hints.spare", {
                  count: hint.play,
                  held: hint.held,
                  need: hint.need,
                  mode: modeName,
                })
              : hint.key === "arenaFaction"
                ? t("hre:teams.hints.arenaFaction", {
                    faction: t(`factions:${hint.faction}` as never, {
                      defaultValue: hint.faction,
                    }),
                  })
                : t(`hre:teams.hints.${hint.key}`)}
          </p>
        ))}
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
                className="text-sm text-muted-foreground"
                data-testid="hre-team-few"
              >
                {t("hre:teams.fewAlliance", {
                  count: view.team.eligibleCount,
                  alliance: alliance ?? "",
                })}
              </p>
            ) : null}
            {view.team.support ? (
              <p
                className="text-sm text-muted-foreground"
                data-testid={`hre-team-support-${view.team.support}`}
              >
                {view.team.support === "included"
                  ? t("hre:teams.supportIncluded")
                  : t("hre:teams.supportMissing")}
              </p>
            ) : null}
            {plan?.preferPsychic ? (
              <p
                className="text-sm text-muted-foreground"
                data-testid="hre-team-psychic"
              >
                {t("hre:teams.psychic")}
              </p>
            ) : null}
            {plan?.abilityFocus ? (
              <p
                className="text-sm text-muted-foreground"
                data-testid={`hre-team-ability-${plan.abilityFocus}`}
              >
                {plan.abilityFocus === "damage"
                  ? t("hre:teams.abilityDamage")
                  : t("hre:teams.abilityUses")}
              </p>
            ) : null}
            {view.team.hseUnits !== null && hseEvent ? (
              <p
                className="text-sm text-muted-foreground"
                data-testid="hre-team-hse"
              >
                {view.team.hseUnits > 0
                  ? t("hre:teams.hse", {
                      count: view.team.hseUnits,
                      event: hseEvent,
                    })
                  : t("hre:teams.hseNone", { event: hseEvent })}
                {view.team.hseUnits > 0 && statBoost
                  ? ` ${t("hre:teams.hseBoost", statBoost)}`
                  : null}
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

/** What the team is: its rule, with the alliance it was drawn from and its size. */
function RuleText({
  team,
  alliance,
  hero,
  wholeTrack,
}: {
  team: RuledTeam
  alliance: string | null
  hero: string
  /** The whole alliance, weakest first (Onslaught ability uses). */
  wholeTrack: boolean
}) {
  const { t } = useTranslation(["hre", "common"])
  const ready = team.status === "ready" ? team : null
  const trackAlliance = ready?.alliance
    ? (t(`common:alliances.${ready.alliance}` as never, {
        defaultValue: ready.alliance,
      }) as string)
    : null
  const size = ready?.team.deliveredSize ?? 0
  // A team the roster or a node's slots keep below five names its real size (issue 7).
  const fielded = ready ? size : HRE_TEAM_SIZE
  if (wholeTrack && trackAlliance) {
    return t("hre:teams.wholeTrack", { size, alliance: trackAlliance })
  }
  switch (team.rule) {
    case "alliance": {
      return alliance
        ? t("hre:teams.alliance", { alliance, size: fielded })
        : t("hre:teams.allianceGeneric", { size: fielded })
    }
    case "summonFree": {
      return t("hre:teams.summonFree", { size: fielded })
    }
    case "ranged": {
      return trackAlliance
        ? t(
            size < HRE_TEAM_SIZE
              ? "hre:teams.rangedTrackFew"
              : "hre:teams.rangedTrack",
            { size, alliance: trackAlliance }
          )
        : t("hre:teams.ranged", { size: fielded })
    }
    case "featured": {
      return t("hre:teams.featured", { hero })
    }
    case "abilities": {
      return trackAlliance
        ? t(
            size <= HRE_TEAM_SIZE
              ? "hre:teams.abilitiesTrackFew"
              : "hre:teams.abilitiesTrack",
            { size, alliance: trackAlliance }
          )
        : t("hre:teams.abilities", { size: fielded })
    }
    case "melee": {
      return t("hre:teams.melee", { size: fielded })
    }
    case "strongest": {
      return trackAlliance
        ? t(
            size < HRE_TEAM_SIZE
              ? "hre:teams.strongestTrackFew"
              : "hre:teams.strongestTrack",
            { size, alliance: trackAlliance }
          )
        : t("hre:teams.strongest", { size: fielded })
    }
  }
}
