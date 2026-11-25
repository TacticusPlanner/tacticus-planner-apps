import { memo } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import { useTeamModeLabel } from "@/entities/team"
import type { Team, TeamMode, TeamRoster } from "@/entities/team"
import { TruncatedText } from "@/shared/ui"
import type { SortableRenderProps } from "@/shared/ui"

import { teamLineup } from "../../model/teams-view"
import { TeamActionButtons } from "./team-actions"
import type { TeamActions } from "./team-actions"
import { TeamOrderHandle, TeamUnitGroup } from "./team-card"
import { TeamStatusChips } from "./team-status-chips"
import { useTeamContext } from "./use-team-context"
import type { TeamStatusItem } from "./use-team-status"

/**
 * One team as a compact phone row (handoff 5.9, the List layout): position and name, its modes,
 * the core characters with a "+N" tile for its flex units and MoWs, and its status chips.
 */
export const TeamListRow = memo(function TeamListRow({
  team,
  roster,
  status,
  moveDisabled,
  actions,
  sectionMode,
  dragHandle,
}: {
  team: Team
  /** The row's drag grip, when its list can be reordered. */
  dragHandle?: SortableRenderProps["dragHandle"]
  /** The mode section the row is listed under: its mode is not repeated. */
  sectionMode?: TeamMode
  roster: TeamRoster | null
  status: readonly TeamStatusItem[]
  moveDisabled: boolean
  actions: TeamActions
}) {
  const { t, i18n } = useTranslation("teams")
  const modeLabel = useTeamModeLabel()
  const context = useTeamContext()(team)
  const lineup = teamLineup(team)
  const more = lineup.flex.length + lineup.coreMows.length
  const flexCount = lineup.flex.length
  const mowCount = lineup.coreMows.length
  const modes = new Intl.ListFormat(i18n.language, {
    type: "unit",
    style: "narrow",
  }).format(team.modes.filter((mode) => mode !== sectionMode).map(modeLabel))
  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border bg-card p-3",
        team.issues.length > 0 && "border-destructive/60"
      )}
      data-issues={team.issues.length > 0 ? "true" : undefined}
    >
      <div className="flex items-center gap-1">
        <TeamOrderHandle
          disabled={moveDisabled}
          dragHandle={dragHandle}
          team={team}
        />
        <TruncatedText
          className="min-w-0 flex-1 font-heading font-semibold wrap-break-word"
          data-testid="team-card-name"
          lines={2}
        >
          {team.name}
        </TruncatedText>
        <TeamActionButtons actions={actions} team={team} />
      </div>
      {context || modes ? (
        <span className="truncate text-xs text-muted-foreground">
          {context ?? modes}
        </span>
      ) : null}
      {team.notes ? (
        <p
          className="line-clamp-2 text-xs wrap-break-word text-muted-foreground"
          data-testid="team-card-notes"
        >
          {team.notes}
        </p>
      ) : null}
      <div className="flex items-center gap-1.5">
        <TeamUnitGroup
          label={t("card.core")}
          roster={roster}
          showLabel={false}
          testId="team-card-core"
          units={lineup.core}
        />
        {more > 0 ? (
          <span
            aria-label={t("list.more", { flex: flexCount, mows: mowCount })}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-dashed text-xs text-muted-foreground tabular-nums"
            data-testid="team-list-more"
            role="img"
          >
            +{more}
          </span>
        ) : null}
      </div>
      <TeamStatusChips items={status} />
    </div>
  )
})
