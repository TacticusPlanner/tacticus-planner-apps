import { useState, type CSSProperties } from "react"
import { useTranslation } from "react-i18next"
import {
  Check,
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Pencil,
  TriangleAlert,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

import {
  MIN_TEAM_MEMBERS,
  ObjectiveIcon,
  useObjectiveLabel,
  type LegendaryEventLane,
  EventUnitChip,
  type EventUnitChipData,
} from "@/entities/legendary-event"
import {
  ClearDepthField,
  depthEstimateContext,
  editStartsFromEstimate,
  type DepthEstimateContext,
} from "@/features/legendary-event-plan"
import { useDebouncedCommit } from "@/shared/lib"
import type { SortableRenderProps } from "@/shared/ui"

import { PointsLeft, TeamPower } from "./team-card-figures"
import {
  depthBandClauses,
  teamDepthBar,
  type DepthBar,
  type DepthTone,
} from "./team-depth-bar"
import type { TeamCardViewModel } from "./teams.view-model"

const FULL_TEAM = 5

export interface TeamCardActions {
  onEdit: () => void
  onDelete: () => void
  /** Called once a run of stepper edits settles, with the final manual depth and the estimate
   *  shown when the run started. */
  onDepthChange: (depth: number | null, shown: DepthEstimateContext) => void
  /** Use estimate: the manual depth is cleared so the estimate (`estimate`) shows again. */
  onUseEstimate: (estimate: number) => void
  /** Mobile only; null hides the item (first / last card). */
  onMoveUp?: (() => void) | null
  onMoveDown?: (() => void) | null
}

/**
 * One team on a lane, laid out to scan as a row (design D4): name with the "N/5" badge for a
 * partial team and the actions menu; members in position order and the reserve as the Event board
 * draws them, beside a coverage strip with one slot per lane objective (covered ones with their
 * points); the depth as a bar over the lane's battles with "Battles 1–n" (toned: set by you, room
 * to spare, close to the next battle) and an edit button that opens the depth stepper with its
 * estimate (shown at once when there is no depth to show); and a Details fold with the points left,
 * Team power and what the same team cleared last run. On desktop the grip is the drag handle.
 * Stepper clicks show at once and are sent as one write once they settle. An incomplete team
 * (fewer than three members) warns that it needs three characters in place of the depth, and keeps
 * Edit, Delete and its place.
 */
export function TeamCard({
  card,
  lane,
  actions,
  sortable,
  lastRunClearedBattle,
}: {
  card: TeamCardViewModel
  lane: Pick<LegendaryEventLane, "unitsRestrictions" | "battleIds">
  actions: TeamCardActions
  /** What the same team cleared in the previous run; absent hides the line. */
  lastRunClearedBattle?: number
  /** Desktop drag wiring; absent on mobile. */
  sortable?: SortableRenderProps
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const style: CSSProperties | undefined = sortable?.style
  // The settled write: clearing the manual depth while an estimate exists is Use estimate.
  const commitDepth = (next: number | null) => {
    if (next === null && card.estimate) {
      actions.onUseEstimate(card.estimate.depth)
      return
    }
    actions.onDepthChange(
      next,
      depthEstimateContext(card.estimate, {
        fromEstimate: editStartsFromEstimate(
          card.expectedBattleClears,
          card.estimate
        ),
        teamPower: card.teamPower,
        memberCount: card.memberCount,
        source: "card",
      })
    )
  }
  const [depth, setDepth] = useDebouncedCommit(
    card.expectedBattleClears,
    commitDepth
  )
  const needsDepth = depth === null && !card.estimate
  const [editing, setEditing] = useState(false)
  const editorShown = editing || needsDepth
  const bar = teamDepthBar(card, lane.battleIds.length)

  return (
    <li
      className={cn(
        "@container/card flex min-w-0 scroll-mt-[calc(var(--mobile-header-height)+6.25rem)] flex-col gap-3 rounded-xl border bg-card p-3 md:scroll-mt-4",
        sortable?.isDragging && "relative z-10 shadow-lg"
      )}
      data-team={card.id}
      data-testid="legendary-event-team-card"
      ref={sortable?.setNodeRef}
      style={style}
    >
      {/* The restrictions sit beside the name on a card wide enough for both (from 28rem), so five
          named member chips keep their own line; a narrower card (phones, three lanes on a laptop)
          gives them a line of their own under the name rather than squeezing the name out. */}
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
        {sortable ? (
          <DragHandle
            handle={sortable.dragHandle}
            label={t("teams.dragHandle", { name: card.name })}
          />
        ) : null}
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <h3
            className="min-w-0 truncate font-semibold"
            data-testid="team-card-name"
            title={card.name}
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
        </span>
        <CoverageStrip
          card={card}
          format={(value) => number.format(value)}
          lane={lane}
        />
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
        className="flex min-w-0 flex-wrap items-center gap-1.5"
        data-testid="team-card-members"
      >
        {card.members.map((member) => (
          <MemberPortrait key={member.unitId} member={member} />
        ))}
        {card.reserve ? (
          <MemberPortrait
            member={card.reserve}
            reserveLabel={t("teams.reserve")}
          />
        ) : null}
      </ul>

      {card.incomplete ? (
        <span
          className="flex items-center gap-1.5 text-xs font-medium text-destructive"
          data-testid="team-card-incomplete"
        >
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          {t("teams.incomplete", { min: MIN_TEAM_MEMBERS })}
        </span>
      ) : (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <TeamDepthBar bar={bar} card={card} />
            <Button
              aria-expanded={editorShown}
              aria-label={t("teams.editDepth")}
              className="shrink-0"
              data-testid="team-card-depth-edit"
              onClick={() => setEditing((open) => !open)}
              size="icon-sm"
              title={t("teams.editDepth")}
              variant={editorShown ? "secondary" : "ghost"}
            >
              <Pencil />
            </Button>
          </div>
          {/* The stepper stays mounted so a run of clicks survives closing it; it only shows
              while editing, or while the team has no depth at all to show. */}
          <div
            className="flex min-w-0 flex-wrap items-start justify-end gap-2"
            data-testid="team-card-depth-editor"
            hidden={!editorShown}
          >
            <span
              className={cn(
                "pt-1.5 text-xs",
                needsDepth
                  ? "font-medium text-primary"
                  : "text-muted-foreground"
              )}
              data-testid="team-card-depth-label"
            >
              {needsDepth ? t("teams.depth.set") : t("teams.depth.label")}
            </span>
            <ClearDepthField
              battleCount={lane.battleIds.length}
              data-testid="team-card-depth"
              estimate={card.estimate}
              lockedMemberCount={card.lockedMemberCount}
              onChange={setDepth}
              value={depth}
            />
          </div>
        </div>
      )}

      <details className="group text-sm" data-testid="team-card-details">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-xs text-muted-foreground select-none hover:text-foreground">
          <ChevronRight
            aria-hidden
            className="size-3.5 transition-transform group-open:rotate-90"
          />
          {t("teams.details")}
        </summary>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-medium tabular-nums">
          <PointsLeft card={card} format={(value) => number.format(value)} />
          <TeamPower card={card} format={(value) => number.format(value)} />
          <DepthBands bar={bar} />
          {lastRunClearedBattle === undefined ? null : (
            <span
              className="text-xs font-normal text-muted-foreground"
              data-testid="team-card-last-run"
            >
              {lastRunClearedBattle > 0
                ? t("teams.lastRun", { battle: lastRunClearedBattle })
                : t("teams.lastRunNone")}
            </span>
          )}
        </div>
      </details>
    </li>
  )
}

/** The lane's objectives as a fixed strip of icons, each with its points: bright when the team
 *  covers it, struck through once cleared through the team's depth, dashed when the members no
 *  longer derive it, and faint when the team does not cover it, so teams scan down by column. */
function CoverageStrip({
  card,
  lane,
  format,
}: {
  card: TeamCardViewModel
  lane: Pick<LegendaryEventLane, "unitsRestrictions">
  format: (value: number) => string
}) {
  const { t } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const coverageByIndex = new Map(
    card.coverage.map((entry) => [entry.index, entry])
  )
  const objectives = [...lane.unitsRestrictions].sort(
    (a, b) => a.index - b.index
  )
  return (
    <ul
      aria-label={t("teams.objectives")}
      className="order-last flex min-w-0 basis-full items-center justify-end gap-1 @min-[28rem]/card:order-0 @min-[28rem]/card:shrink-0 @min-[28rem]/card:basis-auto"
      data-testid="team-card-objectives"
    >
      {objectives.map((objective) => {
        const { label, icon } = objectiveLabel(objective)
        const entry = coverageByIndex.get(objective.index)
        if (!entry)
          return (
            <li
              className="flex w-9 min-w-0 shrink flex-col items-center opacity-25"
              data-testid="team-card-objective-slot"
              key={objective.index}
              title={label}
            >
              <ObjectiveIcon className="size-5" icon={icon} muted />
              <span aria-hidden="true" className="text-xs/3">
                &nbsp;
              </span>
              <span className="sr-only">
                {t("teams.objectiveUncovered", { objective: label })}
              </span>
            </li>
          )
        const muted = !entry.derived
        const cleared = !muted && entry.clearedThrough
        const clearedLabel =
          cleared && card.displayedDepth !== null
            ? t("teams.clearedThrough", { battle: card.displayedDepth })
            : undefined
        return (
          <li
            className={cn(
              "relative flex w-9 min-w-0 shrink flex-col items-center rounded-md border border-transparent py-0.5",
              muted && "border-dashed border-border text-muted-foreground",
              cleared && "text-muted-foreground"
            )}
            data-cleared={cleared ? "true" : undefined}
            data-muted={muted ? "true" : undefined}
            data-testid="team-card-objective"
            key={objective.index}
            title={[label, muted ? t("teams.notCovered") : clearedLabel]
              .filter(Boolean)
              .join(" · ")}
          >
            <ObjectiveIcon
              className="size-5"
              icon={icon}
              muted={muted || cleared}
            />
            <span
              className={cn(
                "text-xs/3 font-semibold tabular-nums",
                cleared && "line-through"
              )}
            >
              {format(entry.points)}
            </span>
            {cleared ? (
              <Check
                aria-hidden
                className="absolute -top-1 -right-0.5 size-3 text-success-foreground"
              />
            ) : null}
            <span className="sr-only">{label}</span>
            {muted ? (
              <span className="sr-only">{t("teams.notCovered")}</span>
            ) : null}
            {clearedLabel ? (
              <span className="sr-only">{clearedLabel}</span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

const TONE_CLASS: Record<DepthTone, string> = {
  manual: "bg-primary",
  room: "bg-success-foreground",
  close: "bg-(--season-fit-caution)",
  none: "bg-muted",
}

/** Diagonal gaps of the card colour across a toned segment: a close battle. */
const CLOSE_STRIPES =
  "repeating-linear-gradient(135deg, transparent 0 4px, var(--card) 4px 5.5px)"

const TONE_COLOR: Record<DepthTone, string> = {
  manual: "var(--primary)",
  room: "var(--success-foreground)",
  close: "var(--season-fit-caution)",
  none: "var(--muted)",
}

/** Thin diagonal stripes of the tone across an empty segment: a stretch battle. */
function stretchStripes(tone: DepthTone): string {
  return `repeating-linear-gradient(135deg, ${TONE_COLOR[tone]} 0 1.25px, transparent 1.25px 5px)`
}

/** The estimate's bands as one sentence ("Clears battles 1–10 for sure, 11 likely, up to 12 at
 *  best"); undefined when they add nothing to the headline depth. */
function useDepthBandsText(bar: DepthBar): string | undefined {
  const { t } = useTranslation("legendaryEvents")
  const clauses = depthBandClauses(bar)
  if (clauses.length === 0) return undefined
  return clauses
    .map(({ key, values }) => t(`teams.depthBar.bands.${key}`, values))
    .join(", ")
}

/** The estimate's bands in the Details fold, so they read without hovering the bar. */
function DepthBands({ bar }: { bar: DepthBar }) {
  const text = useDepthBandsText(bar)
  if (text === undefined) return null
  return (
    <span
      className="basis-full text-xs font-normal text-muted-foreground"
      data-testid="team-card-bands"
    >
      {text}
    </span>
  )
}

/** The team's depth as one segment per lane battle, filled through the depth and toned by where
 *  it comes from (see `teamDepthBar`), with "Battles 1–n" as the headline figure. */
function TeamDepthBar({
  bar,
  card,
}: {
  bar: DepthBar
  card: Pick<TeamCardViewModel, "displayedDepth" | "estimate">
}) {
  const { t } = useTranslation("legendaryEvents")
  // A stored depth past the lane's last battle reads as the whole lane, as the bar fills.
  const depth =
    card.displayedDepth === null
      ? null
      : Math.min(card.displayedDepth, bar.total)
  const headline =
    depth === null
      ? t("teams.depthBar.unset")
      : depth === 0
        ? t("teams.depthBar.cannotClear")
        : t("teams.depthBar.battles", { depth })
  const bands = useDepthBandsText(bar)
  const hint =
    bar.tone === "manual"
      ? t("teams.depthBar.manual")
      : [
          bar.tone === "close" && depth !== null
            ? t("teams.depthBar.close", { battle: depth + 1 })
            : undefined,
          bands,
        ]
          .filter(Boolean)
          .join(" · ") || undefined
  const label =
    depth === null
      ? headline
      : depth === 0
        ? t("teams.depthBar.labelNone", { total: bar.total })
        : t("teams.depthBar.label", { depth, total: bar.total })
  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2"
      data-testid="team-card-depth-bar"
      data-tone={bar.tone}
    >
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          depth === null && "font-medium text-primary"
        )}
        data-testid="team-card-depth-headline"
      >
        {headline}
      </span>
      <span
        aria-label={[label, hint].filter(Boolean).join(" · ")}
        className="flex h-2 min-w-16 flex-1 gap-px"
        role="img"
        title={hint}
      >
        {Array.from({ length: bar.total }, (_, index) => (
          <span
            className={cn(
              "h-full flex-1 first:rounded-l-full last:rounded-r-full",
              index < bar.filled ? TONE_CLASS[bar.tone] : "bg-muted"
            )}
            // Sure battles are solid; close ones (past sure, within the depth) are striped with
            // gaps, and stretch ones (past the depth) are empty with thin stripes of the tone.
            style={
              index >= bar.sure && index < bar.filled
                ? { backgroundImage: CLOSE_STRIPES }
                : index >= bar.filled && index < bar.stretch
                  ? { backgroundImage: stretchStripes(bar.tone) }
                  : undefined
            }
            data-band={
              index < bar.sure
                ? "sure"
                : index < bar.filled
                  ? "close"
                  : index < bar.stretch
                    ? "stretch"
                    : undefined
            }
            key={index}
          />
        ))}
      </span>
    </div>
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
      className="-ml-1 cursor-grab touch-none rounded-sm p-0.5 text-muted-foreground"
      data-testid="team-card-drag-handle"
      ref={ref}
      type="button"
    >
      <GripVertical className="size-4" />
    </button>
  )
}

/** A team member (or the reserve, marked with its label) as a unit chip that opens its details. */
function MemberPortrait({
  member,
  reserveLabel,
}: {
  member: EventUnitChipData
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
    >
      <EventUnitChip
        className={cn(reserveLabel && "border-dashed border-border")}
        focusable
        unit={member}
      />
      {reserveLabel ? (
        <span className="ml-1 text-xs text-muted-foreground">
          {reserveLabel}
        </span>
      ) : null}
    </li>
  )
}
