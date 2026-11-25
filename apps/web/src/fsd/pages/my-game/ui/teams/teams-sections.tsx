import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import { useTeamModeLabel } from "@/entities/team"
import type { Team, TeamMode } from "@/entities/team"
import { useUnitName } from "@/shared/unit-name"

/**
 * The units of the section's teams that are shared, as the team chips say (`sharedUnitsByTeam` over every
 * team), and how many teams have each on a chip: the note and the chips cannot disagree.
 */
function sharedUnits(
  sectionTeams: readonly Team[],
  shared: ReadonlyMap<string, readonly string[]>
) {
  const units = new Map<string, "Character" | "Mow">()
  for (const team of sectionTeams) {
    for (const id of shared.get(team.id) ?? []) {
      units.set(id, team.mowIds.includes(id) ? "Mow" : "Character")
    }
  }
  const flagged = [...shared.values()]
  return [...units].map(([id, kind]) => ({
    id,
    kind,
    teams: flagged.filter((ids) => ids.includes(id)).length,
  }))
}

/**
 * A mode's section when the page is grouped by mode (handoff 5.5): the mode, its team count and,
 * when one of its teams has a shared unit (a unit in another team of a Guild War mode it shares),
 * an amber note naming it. A null mode is the section of teams with none.
 */
export function TeamsModeSection({
  mode,
  teams,
  shared: sharedByTeam,
  children,
}: {
  mode: TeamMode | null
  teams: readonly Team[]
  /** Each team's shared units over every team (the chips' `sharedUnitsByTeam`), filtered out or not. */
  shared: ReadonlyMap<string, readonly string[]>
  children: ReactNode
}) {
  const { t } = useTranslation("teams")
  const modeLabel = useTeamModeLabel()
  const unitName = useUnitName()
  // Only Guild War sections: elsewhere a unit can be in any number of teams.
  const shared = sharedUnits(teams, sharedByTeam)
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
          <SharedHint names={shared.length > 1 ? names : undefined}>
            <span
              className="flex items-center gap-1 text-xs text-amber-800 dark:text-amber-400"
              data-testid="teams-section-shared"
            >
              <AlertTriangle aria-hidden="true" className="size-icon-sm" />
              {shared.length > 1
                ? t("page.sectionSharedMany", { count: shared.length, names })
                : t("page.sectionShared", {
                    unit: unitName(first.kind, first.id),
                    count: first.teams,
                  })}
            </span>
          </SharedHint>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/** The shared-units note, with every shared unit's name in a tooltip when there are several. */
function SharedHint({
  names,
  children,
}: {
  names: string | undefined
  children: ReactNode
}) {
  if (!names) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{names}</TooltipContent>
    </Tooltip>
  )
}
