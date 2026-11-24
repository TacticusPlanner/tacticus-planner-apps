import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import { TEAM_LIMITS, useTeamModeLabel } from "@/entities/team"
import type { Team, TeamMode, TeamRoster } from "@/entities/team"
import { SORTABLE_ITEM_GROUP, SortableList } from "@/shared/ui"

import { teamLineup } from "../../model/teams-view"
import { TeamActionButtons } from "./team-actions"
import type { TeamActions } from "./team-actions"
import { TeamOrderHandle, TeamUnitGroup } from "./team-card"
import { TeamStatusChips } from "./team-status-chips"
import { useTeamContext } from "./use-team-context"
import type { TeamStatusItem } from "./use-team-status"

/** An empty core slot: a dashed 40px outline, decorative (the core count is read from the row). */
function EmptySlot() {
  return (
    <li
      className="size-10 rounded-full border-2 border-dashed border-muted-foreground/40"
      data-testid="team-row-empty-slot"
    />
  )
}

/**
 * The teams as a table (handoff 5.4), to compare lineups slot by slot: position, name with its
 * modes and cap, the core characters with dashed empty slots up to 5, the flex units, the core MoW,
 * the status chips stacked, and Edit and Delete. A row with no issues leaves its status
 * cell empty; a flagged row is tinted.
 */
export function TeamsTable({
  teams,
  roster,
  statusOf,
  moveDisabled,
  actions,
  sectionMode,
  onReorder,
}: {
  teams: readonly Team[]
  /** Saves the rows' new order, as dragged; the page moves them among their own positions. */
  onReorder: (orderedIds: string[]) => void
  /** The mode section the table is under: its mode is not repeated in the rows. */
  sectionMode?: TeamMode
  roster: TeamRoster | null
  statusOf: (team: Team) => TeamStatusItem[]
  moveDisabled: boolean
  actions: TeamActions
}) {
  const { t, i18n } = useTranslation(["teams", "progression"])
  const modeLabel = useTeamModeLabel()
  const context = useTeamContext()
  const list = new Intl.ListFormat(i18n.language, {
    type: "unit",
    style: "narrow",
  })
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table
        aria-label={t("table.label")}
        className="w-full min-w-240 table-fixed text-sm"
        data-testid="teams-table"
      >
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="w-16 p-2 font-medium" scope="col">
              {t("table.position")}
            </th>
            <th className="p-2 font-medium" scope="col">
              {t("table.team")}
            </th>
            {/* Fixed widths, so every mode section's table lines up with the others. */}
            <th className="w-60 p-2 font-medium" scope="col">
              {t("table.core")}
            </th>
            <th className="w-44 p-2 font-medium" scope="col">
              {t("table.flex")}
            </th>
            <th className="w-32 p-2 font-medium" scope="col">
              {t("table.mow")}
            </th>
            <th className="w-44 p-2 font-medium" scope="col">
              {t("table.status")}
            </th>
            <th className="w-24 p-2" scope="col">
              <span className="sr-only">{t("table.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <SortableList
            // A live region inside <tbody> is invalid markup; the table is never inside a dialog.
            accessibilityContainer={
              typeof document === "undefined" ? undefined : document.body
            }
            disabled={moveDisabled}
            getId={(team) => team.id}
            getLabel={(id) => teams.find((team) => team.id === id)?.name ?? id}
            items={[...teams]}
            onReorder={(orderedIds) => onReorder(orderedIds)}
            renderItem={(team, sortable) => {
              const lineup = teamLineup(team)
              // A Campaign or Incursion team has only that mode, so its line names what it is for;
              // the cap is a status chip, not repeated here.
              const second =
                context(team) ??
                list.format(
                  team.modes
                    .filter((mode) => mode !== sectionMode)
                    .map(modeLabel)
                )
              const emptyCore = Math.max(
                0,
                TEAM_LIMITS.maxWarCoreCharacters - lineup.core.length
              )
              return (
                <tr
                  className={cn(
                    SORTABLE_ITEM_GROUP,
                    "border-b bg-card align-middle last:border-b-0 data-dragging:relative data-dragging:z-10 data-dragging:shadow-lg",
                    team.issues.length > 0 && "bg-destructive/14"
                  )}
                  data-dragging={sortable.isDragging || undefined}
                  data-issues={team.issues.length > 0 ? "true" : undefined}
                  data-team={team.id}
                  data-testid="team-row"
                  key={team.id}
                  ref={sortable.setNodeRef}
                  style={sortable.style}
                >
                  <td className="p-2">
                    <TeamOrderHandle
                      disabled={moveDisabled}
                      dragHandle={sortable.dragHandle}
                      team={team}
                    />
                  </td>
                  <td className="p-2">
                    <span
                      className="block truncate font-heading font-semibold"
                      data-testid="team-row-name"
                      title={team.name}
                    >
                      {team.name}
                    </span>
                    <span
                      className="block truncate text-xs text-muted-foreground"
                      title={second}
                    >
                      {second}
                    </span>
                    {team.notes ? (
                      <span
                        className="block truncate text-xs text-muted-foreground"
                        data-testid="team-row-notes"
                        title={team.notes}
                      >
                        {team.notes}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1.5">
                      <TeamUnitGroup
                        label={t("table.core")}
                        roster={roster}
                        showLabel={false}
                        testId="team-row-core"
                        units={lineup.core}
                      />
                      {emptyCore > 0 ? (
                        <ul aria-hidden="true" className="flex gap-1.5">
                          {Array.from({ length: emptyCore }, (_, slot) => (
                            <EmptySlot key={slot} />
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-2">
                    <TeamUnitGroup
                      label={t("table.flex")}
                      roster={roster}
                      showLabel={false}
                      testId="team-row-flex"
                      units={lineup.flex}
                    />
                  </td>
                  <td className="p-2">
                    <TeamUnitGroup
                      label={t("table.mow")}
                      roster={roster}
                      showLabel={false}
                      testId="team-row-mows"
                      units={lineup.coreMows}
                    />
                  </td>
                  <td className="p-2">
                    <TeamStatusChips items={statusOf(team)} stacked />
                  </td>
                  <td className="p-2">
                    <TeamActionButtons actions={actions} team={team} />
                  </td>
                </tr>
              )
            }}
          />
        </tbody>
      </table>
    </div>
  )
}
