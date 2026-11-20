import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle } from "lucide-react"

import { EXCLUSIVE_UNIT_MODES, useTeamModeLabel } from "@/entities/team"
import type { Team, TeamMode } from "@/entities/team"
import { useUnitName } from "@/shared/unit-name"

/**
 * The section's units that two or more of all the teams with the mode have, and how many: the same
 * sharing the team chips show, whatever the filter hides, for the units this section shows.
 */
function sharedUnits(
  mode: TeamMode,
  sectionTeams: readonly Team[],
  allTeams: readonly Team[]
) {
  const inMode = allTeams.filter((team) => team.modes.includes(mode))
  const units = new Map<string, "Character" | "Mow">()
  for (const team of sectionTeams) {
    for (const id of team.characterIds) units.set(id, "Character")
    for (const id of team.mowIds) units.set(id, "Mow")
  }
  return [...units]
    .map(([id, kind]) => ({
      id,
      kind,
      teams: inMode.filter(
        (team) => team.characterIds.includes(id) || team.mowIds.includes(id)
      ).length,
    }))
    .filter((unit) => unit.teams > 1)
}

/**
 * A mode's section when the page is grouped by mode (handoff 5.5): the mode, its team count and,
 * when one of its units is in two teams of a Guild War mode, an amber note naming it. A null mode
 * is the section of teams with none.
 */
export function TeamsModeSection({
  mode,
  teams,
  allTeams,
  children,
}: {
  mode: TeamMode | null
  teams: readonly Team[]
  /** Every team, so a unit shared with a filtered-out team is still flagged, as on its chips. */
  allTeams: readonly Team[]
  children: ReactNode
}) {
  const { t } = useTranslation("teams")
  const modeLabel = useTeamModeLabel()
  const unitName = useUnitName()
  // Only Guild War sections: elsewhere a unit can be in any number of teams.
  const shared =
    mode !== null && EXCLUSIVE_UNIT_MODES.includes(mode)
      ? sharedUnits(mode, teams, allTeams)
      : []
  const [first] = shared
  const names = shared.map((unit) => unitName(unit.kind, unit.id)).join(", ")
  const headingId = `teams-section-${mode ?? "none"}`
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3"
      data-mode={mode ?? "none"}
      data-testid="teams-section"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-heading text-base font-semibold" id={headingId}>
          {mode === null ? t("page.noModeSection") : modeLabel(mode)}
        </h2>
        <span className="text-xs text-muted-foreground">
          {t("page.sectionCount", { count: teams.length })}
        </span>
        {first ? (
          <span
            className="flex items-center gap-1 text-xs text-amber-800 dark:text-amber-400"
            data-testid="teams-section-shared"
            title={shared.length > 1 ? names : undefined}
          >
            <AlertTriangle aria-hidden="true" className="size-3.5" />
            {shared.length > 1
              ? t("page.sectionSharedMany", { count: shared.length, names })
              : t("page.sectionShared", {
                  unit: unitName(first.kind, first.id),
                  count: first.teams,
                })}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  )
}
