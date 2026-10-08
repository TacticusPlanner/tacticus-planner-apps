import type { CSSProperties } from "react"
import { useTranslation } from "react-i18next"
import { GripVertical, MoreHorizontal } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

import {
  ObjectiveIcon,
  useObjectiveLabel,
  type LegendaryEventLane,
} from "@/entities/legendary-event"
import { ClearDepthStepper } from "@/features/legendary-event-teams"
import { EntityIcon, type SortableRenderProps } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import type { TeamCardMember, TeamCardViewModel } from "./teams.view-model"

const FULL_TEAM = 5

export interface TeamCardActions {
  onEdit: () => void
  onDelete: () => void
  onDepthChange: (depth: number | null) => void
  /** Mobile only; null hides the item (first / last card). */
  onMoveUp?: (() => void) | null
  onMoveDown?: (() => void) | null
}

/**
 * One team on a lane (design D4): name with the "N/5" badge for a partial team, member portraits
 * in position order and the reserve, the covered objectives as chips (muted when the members no
 * longer derive one), points per battle, the current run's depth stepper ("Set depth" when none)
 * and the actions menu. On desktop the grip is the drag handle.
 */
export function TeamCard({
  card,
  lane,
  actions,
  sortable,
}: {
  card: TeamCardViewModel
  lane: Pick<LegendaryEventLane, "unitsRestrictions" | "battleIds">
  actions: TeamCardActions
  /** Desktop drag wiring; absent on mobile. */
  sortable?: SortableRenderProps
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const unitName = useUnitName()
  const objectiveLabel = useObjectiveLabel()
  const number = new Intl.NumberFormat(i18n.language)
  const objectiveOf = (index: number) =>
    lane.unitsRestrictions.find((objective) => objective.index === index)
  const style: CSSProperties | undefined = sortable?.style

  return (
    <li
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-3",
        sortable?.isDragging && "relative z-10 shadow-lg"
      )}
      data-team={card.id}
      data-testid="legendary-event-team-card"
      ref={sortable?.setNodeRef}
      style={style}
    >
      <div className="flex min-w-0 items-center gap-2">
        {sortable ? (
          <DragHandle
            handle={sortable.dragHandle}
            label={t("teams.dragHandle", { name: card.name })}
          />
        ) : null}
        <h3
          className="min-w-0 truncate font-semibold"
          data-testid="team-card-name"
        >
          {card.name}
        </h3>
        {card.memberCount < FULL_TEAM ? (
          <span
            className="shrink-0 rounded-full border px-1.5 text-xs text-muted-foreground tabular-nums"
            data-testid="team-card-count"
          >
            {t("teams.partialBadge", {
              members: card.memberCount,
              max: FULL_TEAM,
            })}
          </span>
        ) : null}
        <span className="ml-auto" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={t("teams.menu.label", { name: card.name })}
              data-testid="team-card-menu"
              size="icon-sm"
              variant="ghost"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              data-testid="team-card-edit"
              onSelect={actions.onEdit}
            >
              {t("teams.menu.edit")}
            </DropdownMenuItem>
            {actions.onMoveUp ? (
              <DropdownMenuItem
                data-testid="team-card-move-up"
                onSelect={actions.onMoveUp}
              >
                {t("teams.menu.moveUp")}
              </DropdownMenuItem>
            ) : null}
            {actions.onMoveDown ? (
              <DropdownMenuItem
                data-testid="team-card-move-down"
                onSelect={actions.onMoveDown}
              >
                {t("teams.menu.moveDown")}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              data-testid="team-card-delete"
              onSelect={actions.onDelete}
              variant="destructive"
            >
              {t("teams.menu.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ul
        aria-label={t("teams.members")}
        className="flex flex-wrap items-center gap-1.5"
        data-testid="team-card-members"
      >
        {card.members.map((member) => (
          <MemberPortrait
            key={member.unitId}
            member={member}
            name={unitName("Character", member.unitId)}
          />
        ))}
        {card.reserve ? (
          <MemberPortrait
            member={card.reserve}
            name={unitName("Character", card.reserve.unitId)}
            reserveLabel={t("teams.reserve")}
          />
        ) : null}
      </ul>

      {card.coverage.length > 0 ? (
        <ul
          className="flex flex-wrap gap-1.5"
          data-testid="team-card-objectives"
        >
          {card.coverage.map((entry) => {
            const objective = objectiveOf(entry.index)
            if (!objective) return null
            const { label, icon } = objectiveLabel(objective)
            const muted = !entry.covered
            return (
              <li
                className={cn(
                  "flex max-w-full min-w-0 items-center gap-1.5 rounded-full border bg-muted/40 py-0.5 pr-2 pl-1 text-xs",
                  muted && "border-dashed text-muted-foreground"
                )}
                data-muted={muted ? "true" : undefined}
                data-testid="team-card-objective"
                key={entry.index}
                title={muted ? t("teams.notCovered") : undefined}
              >
                <ObjectiveIcon className="size-4" icon={icon} muted={muted} />
                <span className="truncate">{label}</span>
                <span className="font-semibold tabular-nums">
                  {number.format(entry.points)}
                </span>
                {muted ? (
                  <span className="sr-only">{t("teams.notCovered")}</span>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className="text-sm font-medium tabular-nums"
          data-testid="team-card-points"
        >
          {t("teams.pointsPerBattle", {
            points: number.format(card.pointsPerBattle),
          })}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs",
              card.expectedBattleClears === null
                ? "font-medium text-primary"
                : "text-muted-foreground"
            )}
            data-testid="team-card-depth-label"
          >
            {card.expectedBattleClears === null
              ? t("teams.depth.set")
              : t("teams.depth.label")}
          </span>
          <ClearDepthStepper
            battleCount={lane.battleIds.length}
            data-testid="team-card-depth"
            onChange={actions.onDepthChange}
            value={card.expectedBattleClears}
          />
        </div>
      </div>
    </li>
  )
}

function DragHandle({
  handle,
  label,
}: {
  handle: SortableRenderProps["dragHandle"]
  label: string
}) {
  const { ref, attributes, listeners } = handle
  return (
    <button
      {...attributes}
      {...listeners}
      aria-label={label}
      className="-ml-1 cursor-grab touch-none rounded p-0.5 text-muted-foreground"
      data-testid="team-card-drag-handle"
      ref={ref}
      type="button"
    >
      <GripVertical className="size-4" />
    </button>
  )
}

function MemberPortrait({
  member,
  name,
  reserveLabel,
}: {
  member: TeamCardMember
  name: string
  reserveLabel?: string
}) {
  return (
    <li
      className={cn(
        "relative flex items-center",
        reserveLabel && "ml-1 border-l pl-2"
      )}
      data-reserve={reserveLabel ? "true" : undefined}
      data-testid="team-card-member"
      data-unit={member.unitId}
      title={reserveLabel ? `${name} · ${reserveLabel}` : name}
    >
      <EntityIcon
        alt={name}
        className={cn(
          "size-9 rounded-full",
          member.owned === false && "opacity-50 grayscale",
          reserveLabel && "size-7 border border-dashed"
        )}
        src={characterIcon(member.unitId as UnitId)}
      />
      {reserveLabel ? (
        <span className="ml-1 text-xs text-muted-foreground">
          {reserveLabel}
        </span>
      ) : null}
    </li>
  )
}
