import { memo } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import {
  TeamUnitPortrait,
  teamUnitView,
  useTeamModeLabel,
} from "@/entities/team"
import type { Team, TeamMode, TeamRoster } from "@/entities/team"
import { DragGrip } from "@/shared/ui"
import type { SortableRenderProps } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { teamLineup } from "../../model/teams-view"
import type { TeamLineupUnit } from "../../model/teams-view"
import { TeamActionButtons } from "./team-actions"
import type { TeamActions } from "./team-actions"
import { TeamStatusChips } from "./team-status-chips"
import { useTeamContext } from "./use-team-context"
import type { TeamStatusItem } from "./use-team-status"

/** A group of lineup portraits at the 40px size, each named for screen readers. */
export function TeamUnitGroup({
  units,
  roster,
  label,
  testId,
  showLabel = true,
}: {
  units: readonly TeamLineupUnit[]
  roster: TeamRoster | null
  label: string
  testId: string
  showLabel?: boolean
}) {
  const { t } = useTranslation("teams")
  const unitName = useUnitName()
  if (units.length === 0) return null
  return (
    <div className="flex min-w-0 items-center gap-2" data-testid={testId}>
      {showLabel ? (
        <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      ) : null}
      <ul aria-label={label} className="flex flex-wrap gap-1.5">
        {units.map(({ kind, id }) => {
          const view = teamUnitView(kind, id, roster)
          const name = unitName(kind === "mow" ? "Mow" : "Character", id)
          return (
            <li
              aria-label={
                view.owned === false ? t("card.locked", { name }) : name
              }
              data-locked={view.owned === false ? "true" : undefined}
              data-unit={id}
              key={`${kind}:${id}`}
              title={name}
            >
              <TeamUnitPortrait unit={view} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * A team's place in the order, as on the Goals board: when the list can be reordered the shared drag
 * grip (shown on hover or keyboard focus, always on touch), then its position number.
 */
export function TeamOrderHandle({
  team,
  dragHandle,
  disabled,
}: {
  team: Pick<Team, "name" | "position">
  dragHandle?: SortableRenderProps["dragHandle"]
  disabled: boolean
}) {
  const { t } = useTranslation("teams")
  return (
    <span className="relative z-10 flex shrink-0 items-center">
      {dragHandle ? (
        <DragGrip
          data-testid="team-card-drag"
          disabled={disabled}
          dragHandle={dragHandle}
          label={t("card.drag", { name: team.name })}
        />
      ) : null}
      <span
        className="min-w-5 text-center text-xs font-semibold tabular-nums"
        data-testid="team-position"
      >
        <span className="sr-only">{t("card.positionLabel")} </span>
        {team.position}
      </span>
    </span>
  )
}

/**
 * One saved team as a card (handoff 5.3): its position and drag grip, name, Edit and Delete; its
 * other modes; the core characters; the flex units and the core MoW; its notes; and its status
 * chips. As on Goals cards, the card itself opens nothing. A team that breaks a rule has a
 * destructive border.
 */
export const TeamCard = memo(function TeamCard({
  team,
  roster,
  status,
  moveDisabled,
  actions,
  sectionMode,
  dragHandle,
}: {
  team: Team
  /** The card's drag grip, when its list can be reordered. */
  dragHandle?: SortableRenderProps["dragHandle"]
  /** The mode section the card is listed under: its badge is not repeated. */
  sectionMode?: TeamMode
  roster: TeamRoster | null
  status: readonly TeamStatusItem[]
  moveDisabled: boolean
  actions: TeamActions
}) {
  const { t } = useTranslation("teams")
  const modeLabel = useTeamModeLabel()
  const context = useTeamContext()(team)
  const lineup = teamLineup(team)
  const empty = team.characterIds.length === 0 && team.mowIds.length === 0
  const modes = team.modes.filter((mode) => mode !== sectionMode)

  return (
    <div
      className={cn(
        "relative flex h-full flex-col gap-3 rounded-xl border bg-card p-4",
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
        <h2 className="min-w-0 flex-1 font-heading text-base/snug font-semibold">
          {/* As on Goals cards, the card opens nothing: Edit does, so a stray tap on a phone
              never opens the editor. */}
          <span
            className="line-clamp-2 wrap-break-word"
            data-testid="team-card-name"
            title={team.name}
          >
            {team.name}
          </span>
        </h2>
        <TeamActionButtons actions={actions} team={team} />
      </div>

      {modes.length > 0 ? (
        <ul aria-label={t("editor.modes")} className="flex flex-wrap gap-1">
          {modes.map((mode) => (
            <li key={mode}>
              <Badge variant="outline">{modeLabel(mode)}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
      {context ? (
        <p
          className="-mt-1 truncate text-xs text-muted-foreground"
          data-testid="team-card-context"
          title={context}
        >
          {context}
        </p>
      ) : null}

      <TeamUnitGroup
        label={t("card.core")}
        roster={roster}
        showLabel={false}
        testId="team-card-core"
        units={lineup.core}
      />
      {lineup.flex.length > 0 || lineup.coreMows.length > 0 ? (
        <div className="flex min-h-10 flex-wrap items-center gap-x-4 gap-y-2">
          <TeamUnitGroup
            label={t("card.flex")}
            roster={roster}
            testId="team-card-flex"
            units={lineup.flex}
          />
          <TeamUnitGroup
            label={t("card.mows")}
            roster={roster}
            testId="team-card-mows"
            units={lineup.coreMows}
          />
        </div>
      ) : null}
      {empty ? (
        <span className="text-sm text-muted-foreground">
          {t("card.noUnits")}
        </span>
      ) : null}
      {team.notes ? (
        <p
          className="line-clamp-2 text-sm wrap-break-word text-muted-foreground italic"
          data-testid="team-card-notes"
          title={team.notes}
        >
          {team.notes}
        </p>
      ) : null}

      <TeamStatusChips className="mt-auto" items={status} />
    </div>
  )
})
