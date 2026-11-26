import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { Rarity } from "@workspace/game-domain"

import { TeamUnitPortrait } from "@/entities/team"
import type { TeamRoster } from "@/entities/team"
import { EmptyState } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { cappedView } from "../../model/capped-view"
import { coreUnits } from "../../model/offense"
import type { OffenseTeam, UnitKind } from "../../model/offense"

/** How many deployed units a blocked team names before "and N more". */
const NAMED_DEPLOYED = 3

/**
 * The player's War Offense teams: the ready ones first, then the blocked ones, each naming every
 * core unit that already attacked (dimmed in the lineup), its units shown at the defenders' cap. Select puts a team's
 * core units in the selection; Create team opens the team editor with War Offense picked.
 */
export function OffenseTeams({
  teams,
  roster,
  cap,
  onSelect,
  onNewTeam,
}: {
  teams: readonly OffenseTeam[]
  roster: TeamRoster | null
  cap: Rarity | undefined
  onSelect: (units: { id: string; kind: UnitKind }[]) => void
  onNewTeam: () => void
}) {
  const { t, i18n } = useTranslation("guildWar")
  const unitName = useUnitName()
  const nameOf = (kind: UnitKind, id: string) =>
    unitName(kind === "mow" ? "Mow" : "Character", id)
  const deployedNames = (units: readonly { id: string; kind: UnitKind }[]) => {
    const names = units.map((unit) => nameOf(unit.kind, unit.id))
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
        <Button onClick={onNewTeam} size="sm" variant="ghost">
          <Plus data-icon="inline-start" />
          {t("teams.createTeam")}
        </Button>
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
          const blocked = deployedCore.length > 0
          const deployedIds = new Set(deployedCore.map((unit) => unit.id))
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
                  onClick={() => onSelect(core)}
                  size="sm"
                  variant="outline"
                >
                  {t("teams.select")}
                </Button>
              </div>
              <ul aria-label={t("teams.core")} className="flex flex-wrap gap-1">
                {core.map((unit) => {
                  const deployed = deployedIds.has(unit.id)
                  return (
                    <li
                      aria-label={
                        deployed
                          ? t("teams.deployedUnit", {
                              name: nameOf(unit.kind, unit.id),
                            })
                          : nameOf(unit.kind, unit.id)
                      }
                      className={cn(deployed && "opacity-40 grayscale")}
                      data-deployed={deployed ? "true" : undefined}
                      key={unit.id}
                    >
                      <TeamUnitPortrait
                        unit={cappedView(unit.kind, unit.id, roster, cap)}
                      />
                    </li>
                  )
                })}
              </ul>
              {blocked ? (
                <p
                  className="text-xs text-amber-800 dark:text-amber-400"
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
