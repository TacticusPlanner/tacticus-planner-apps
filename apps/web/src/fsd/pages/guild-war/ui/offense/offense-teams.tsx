import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { TeamUnitPortrait, teamUnitView } from "@/entities/team"
import type { TeamRoster } from "@/entities/team"
import { useUnitName } from "@/shared/unit-name"

import { coreUnits } from "../../model/offense"
import type { OffenseTeam, UnitKind } from "../../model/offense"

/**
 * The player's War Offense teams: the ready ones first, then the blocked ones, each saying which of
 * its core units already attacked. Select puts a team's core units in the selection.
 */
export function OffenseTeams({
  teams,
  roster,
  onSelect,
}: {
  teams: readonly OffenseTeam[]
  roster: TeamRoster | null
  onSelect: (units: { id: string; kind: UnitKind }[]) => void
}) {
  const { t } = useTranslation("guildWar")
  const unitName = useUnitName()
  const nameOf = (kind: UnitKind, id: string) =>
    unitName(kind === "mow" ? "Mow" : "Character", id)

  return (
    <section
      aria-labelledby="guild-war-teams-heading"
      className="flex flex-col gap-2"
      data-testid="guild-war-teams"
    >
      <h2 className="text-sm font-medium" id="guild-war-teams-heading">
        {t("teams.heading")}
      </h2>
      <ul className="grid gap-2 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]">
        {teams.map(({ team, blockedBy }) => {
          const core = coreUnits(team)
          return (
            <li
              className={cn(
                "flex flex-col gap-2 rounded-xl border bg-card p-3",
                blockedBy && "opacity-70"
              )}
              data-blocked={blockedBy ? "true" : undefined}
              data-testid="guild-war-team"
              key={team.id}
            >
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {team.name}
                </span>
                <Button
                  aria-label={t("teams.selectTeam", { name: team.name })}
                  disabled={blockedBy !== null}
                  onClick={() => onSelect(core)}
                  size="sm"
                  variant="outline"
                >
                  {t("teams.select")}
                </Button>
              </div>
              <ul aria-label={t("teams.core")} className="flex flex-wrap gap-1">
                {core.map((unit) => (
                  <li aria-label={nameOf(unit.kind, unit.id)} key={unit.id}>
                    <TeamUnitPortrait
                      unit={teamUnitView(unit.kind, unit.id, roster)}
                    />
                  </li>
                ))}
              </ul>
              {blockedBy ? (
                <p
                  className="text-xs text-amber-800 dark:text-amber-400"
                  data-testid="guild-war-team-blocked"
                >
                  {t("teams.blocked", {
                    name: nameOf(blockedBy.kind, blockedBy.id),
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
