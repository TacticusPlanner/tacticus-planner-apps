import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle } from "lucide-react"

import { EXCLUSIVE_UNIT_MODES, useTeamModeLabel } from "@/entities/team"
import type { Team, TeamMode } from "@/entities/team"
import { useUnitName } from "@/shared/unit-name"

/** The units two or more of the section's teams share, and how many teams have each. */
function sharedUnits(teams: readonly Team[]) {
  const counts = new Map<string, { kind: "Character" | "Mow"; teams: number }>()
  for (const team of teams) {
    for (const id of team.characterIds) {
      counts.set(id, {
        kind: "Character",
        teams: (counts.get(id)?.teams ?? 0) + 1,
      })
    }
    for (const id of team.mowIds) {
      counts.set(id, { kind: "Mow", teams: (counts.get(id)?.teams ?? 0) + 1 })
    }
  }
  return [...counts]
    .filter(([, entry]) => entry.teams > 1)
    .map(([id, entry]) => ({ id, ...entry }))
}

/**
 * A mode's section when the page is grouped by mode (handoff 5.5): the mode, its team count and,
 * when two of its teams share a unit, an amber note naming it.
 */
export function TeamsModeSection({
  mode,
  teams,
  children,
}: {
  mode: TeamMode
  teams: readonly Team[]
  children: ReactNode
}) {
  const { t } = useTranslation("teams")
  const modeLabel = useTeamModeLabel()
  const unitName = useUnitName()
  // Only Guild War sections: elsewhere a unit can be in any number of teams.
  const shared = EXCLUSIVE_UNIT_MODES.includes(mode) ? sharedUnits(teams) : []
  const [first] = shared
  const names = shared.map((unit) => unitName(unit.kind, unit.id)).join(", ")
  const headingId = `teams-section-${mode}`
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3"
      data-mode={mode}
      data-testid="teams-section"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-heading text-base font-semibold" id={headingId}>
          {modeLabel(mode)}
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
