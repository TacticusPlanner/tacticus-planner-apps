import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { ArrowRight, Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { Rarity } from "@workspace/game-domain"

import { TeamUnitPortrait } from "@/entities/team"
import type { Team, TeamRoster } from "@/entities/team"
import { EmptyState } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { cappedView } from "../../model/capped-view"
import { coreUnits, flexUnits } from "../../model/offense"
import type { OffenseTeam, UnitKind } from "../../model/offense"

/** How many deployed units a blocked team names before "and N more". */
const NAMED_DEPLOYED = 3

/** One unit of a team card, at the defenders' cap; dimmed and named so once it attacked. */
function TeamCardUnit({
  unit,
  deployed,
  roster,
  cap,
}: {
  unit: { id: string; kind: UnitKind }
  deployed: boolean
  roster: TeamRoster | null
  cap: Rarity | undefined
}) {
  const { t } = useTranslation("guildWar")
  const unitName = useUnitName()
  const name = unitName(unit.kind === "mow" ? "Mow" : "Character", unit.id)
  return (
    <li
      aria-label={deployed ? t("teams.deployedUnit", { name }) : name}
      className={cn(deployed && "opacity-40 grayscale")}
      data-deployed={deployed ? "true" : undefined}
    >
      <TeamUnitPortrait unit={cappedView(unit.kind, unit.id, roster, cap)} />
    </li>
  )
}

/**
 * The player's War Offense teams: the ready ones first, then the blocked ones, each naming every
 * core unit that already attacked. A card shows the core and, after a divider, the flex units, at
 * the defenders' cap, the ones that attacked dimmed; only a core unit blocks a team. Select picks
 * the core, then the flex units that have not attacked while the attack has room
 * (`teamSelection`). All teams opens the Teams page; Create team opens the team editor with War
 * Offense picked.
 */
export function OffenseTeams({
  teams,
  roster,
  cap,
  deployed,
  onSelect,
  onNewTeam,
}: {
  teams: readonly OffenseTeam[]
  roster: TeamRoster | null
  cap: Rarity | undefined
  /** Every unit that already attacked in this war. */
  deployed: ReadonlySet<string>
  onSelect: (team: Team) => void
  onNewTeam: () => void
}) {
  const { t, i18n } = useTranslation("guildWar")
  const unitName = useUnitName()
  const deployedNames = (units: readonly { id: string; kind: UnitKind }[]) => {
    const names = units.map((unit) =>
      unitName(unit.kind === "mow" ? "Mow" : "Character", unit.id)
    )
    const shown =
      names.length > NAMED_DEPLOYED
        ? [
            ...names.slice(0, NAMED_DEPLOYED - 1),
            t("teams.more", { count: names.length - NAMED_DEPLOYED + 1 }),
          ]
        : names
    return new Intl.ListFormat(i18n.language, {
      type: "conjunction",
    }).format(shown)
  }

  return (
    <section
      aria-labelledby="guild-war-teams-heading"
      className="flex flex-col gap-2"
      data-testid="guild-war-teams"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium" id="guild-war-teams-heading">
          {t("teams.heading")}
        </h2>
        <div className="flex items-center gap-1">
          <Button asChild size="sm" variant="ghost">
            <Link to="/my-game/teams">
              {t("teams.allTeams")}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button onClick={onNewTeam} size="sm" variant="ghost">
            <Plus data-icon="inline-start" />
            {t("teams.createTeam")}
          </Button>
        </div>
      </div>
      {teams.length === 0 ? (
        // Create team is in the heading row, so the empty state needs no action of its own.
        <EmptyState
          testId="guild-war-teams-empty"
          title={t("teams.empty")}
          variant="empty"
        />
      ) : null}
      <ul className="grid gap-2 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]">
        {teams.map(({ team, deployedCore }) => {
          const core = coreUnits(team)
          const flex = flexUnits(team)
          const blocked = deployedCore.length > 0
          return (
            <li
              className="flex flex-col gap-2 rounded-xl border bg-card p-3"
              data-blocked={blocked ? "true" : undefined}
              data-testid="guild-war-team"
              key={team.id}
            >
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {team.name}
                </span>
                <Button
                  aria-label={t("teams.selectTeam", { name: team.name })}
                  disabled={blocked}
                  onClick={() => onSelect(team)}
                  size="sm"
                  variant="outline"
                >
                  {t("teams.select")}
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <ul
                  aria-label={t("teams.core")}
                  className="flex flex-wrap gap-1"
                >
                  {core.map((unit) => (
                    <TeamCardUnit
                      cap={cap}
                      deployed={deployed.has(unit.id)}
                      key={unit.id}
                      roster={roster}
                      unit={unit}
                    />
                  ))}
                </ul>
                {flex.length > 0 ? (
                  <ul
                    aria-label={t("teams.flex")}
                    className="flex flex-wrap gap-1 border-l pl-2"
                    data-testid="guild-war-team-flex"
                  >
                    {flex.map((unit) => (
                      <TeamCardUnit
                        cap={cap}
                        deployed={deployed.has(unit.id)}
                        key={unit.id}
                        roster={roster}
                        unit={unit}
                      />
                    ))}
                  </ul>
                ) : null}
              </div>
              {blocked ? (
                <p
                  className="text-xs text-warning-foreground"
                  data-testid="guild-war-team-blocked"
                >
                  {t("teams.blocked", {
                    count: deployedCore.length,
                    names: deployedNames(deployedCore),
                  })}
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
