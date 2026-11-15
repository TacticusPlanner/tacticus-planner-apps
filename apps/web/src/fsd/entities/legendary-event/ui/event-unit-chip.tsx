import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { characterIcon, rankIcon, traitIcon } from "@workspace/game-catalog"
import { progressionRarity, type UnitId } from "@workspace/game-domain"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@workspace/ui/components/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { useLongPress } from "@/shared/lib"
import { EntityIcon } from "@/shared/ui"

import type { EventUnitChipData } from "../lib/event-unit-chip-data"
import {
  eventUnitChipLayout,
  type EventUnitChipLayout,
} from "../lib/event-unit-chip-layout"
import { useRankShading } from "../model/rank-shading-context"
import { useEventUnitChipNames } from "../model/use-event-unit-chip-names"
import { EventUnitChipDetails } from "./event-unit-chip-details"
import { RarityBadge } from "./rarity-badge"

/** The chip's rank shading: the rank colour at 30% over the card, edged at 70% (lighter than the
 *  leaderboards' `rankTone`, so the name and the rarity badge stay the first thing read). */
function chipRankTone(rank: EventUnitChipData["rank"]): CSSProperties {
  const token = `var(--rank-${rank!.toLowerCase()})`
  return {
    backgroundColor: `color-mix(in oklab, ${token} 30%, var(--card))`,
    borderColor: `color-mix(in oklab, ${token} 70%, var(--card))`,
  }
}

/** One layout's classes for the chip's parts. */
interface LayoutLooks {
  root: string
  name: string
  abilities: string
  portraitBox: string
  portrait: string
  badge: string
  rank: string
}

// The parts, the same in every layout: a 32px portrait with an 18px rarity badge on its bottom-left
// corner and a 24px rank icon.
const PARTS = {
  portraitBox: "mr-1",
  portrait: "size-8",
  badge: "-bottom-1 -left-1 size-4.5",
  rank: "mr-1 size-6",
}

// Tailwind only generates classes it finds spelled out, so each layout's are written in full.
// Stack (N4): the name across the top, portrait, rank, levels (stacked) and traits under it.
const STACK: LayoutLooks = {
  root: "[grid-template-areas:'name_name_name_name''portrait_rank_abilities_traits'] px-1 pt-0.5 pb-1",
  name: "mb-1",
  abilities: "",
  ...PARTS,
}
// Row (N1): the name beside the portrait and rank, the levels side by side under the name.
const ROW: LayoutLooks = {
  root: "[grid-template-areas:'portrait_rank_name_traits''portrait_rank_abilities_traits'] px-1 py-1",
  name: "",
  abilities: "flex-row gap-2",
  ...PARTS,
}
// Auto (board columns): stacked (~94px, fits a 5.9rem column), and a row once the column is
// 8.5rem wide (see `eventUnitChipLayout`).
const AUTO: LayoutLooks = {
  root: `${STACK.root} @[8.5rem]:[grid-template-areas:'portrait_rank_name_traits''portrait_rank_abilities_traits'] @[8.5rem]:py-1`,
  name: "mb-1 @[8.5rem]:mb-0",
  abilities: "@[8.5rem]:flex-row @[8.5rem]:gap-2",
  ...PARTS,
}

/** The classes for a layout's parts: row (N1), stack (N4) or auto (a board column's choice). */
function layoutClasses(layout: EventUnitChipLayout): LayoutLooks {
  if (layout.kind === "row") return ROW
  if (layout.kind === "stack") return STACK
  return AUTO
}

/** Activating the chip, when it is itself the control (the Event board's unit table). */
export interface EventUnitChipAction {
  onActivate: () => void
  /** What activating does, as the button's accessible description. */
  hint: string
  testId?: string
  /** -1 keeps the chip out of the Tab order, where its table moves focus with the arrow keys. */
  tabIndex?: number
}

/**
 * One unit on the event page (the Event board, team cards, the team picker, token cards): its name,
 * its portrait with a rarity letter badge, its rank icon and its active and passive ability
 * levels. Each place uses one layout for all its chips (see `eventUnitChipLayout`): team and
 * token cards show the name beside the portrait (a row, design N1); the Event board's columns
 * stack it across the top (design N4) and turn every chip into a row once the column is wide
 * enough. It is tinted in its rank colour while the page's Rank shading is on. Ascension stars
 * show only in the details. A unit the player does not own is muted and reads "Locked"; with no roster only the name and portrait show. A Healer or
 * Mechanic shows its trait icon at the end when the chip sits in a container (`@container`) wide
 * enough for it.
 *
 * Hover or keyboard focus shows the unit's details (long name, rarity with stars, rank, ability
 * levels); on touch a long-press opens them in a panel and a tap keeps the chip's action. With
 * `action` the chip is itself a button. With `focusable` (a team card) it is a button that opens
 * the details panel. Otherwise it is a plain span, as it sits inside another control (a picker
 * tile).
 */
export function EventUnitChip({
  unit,
  showName = true,
  fill = false,
  action,
  focusable = false,
  className,
}: {
  unit: EventUnitChipData
  /** Off where the surrounding tile already names the unit (the team picker). */
  showName?: boolean
  /** Fill the container's width (a table column) instead of sizing to the content. */
  fill?: boolean
  action?: EventUnitChipAction
  /** Without `action`: be a button that opens the details, so they can be read without a pointer
   *  or a long-press. */
  focusable?: boolean
  className?: string
}) {
  const { t } = useTranslation([
    "legendaryEvents",
    "common",
    "progression",
    "traits",
  ])
  const names = useEventUnitChipNames()(unit.unitId)
  const { shaded } = useRankShading()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const anchorRef = useRef<HTMLElement>(null)
  // Escape closes the panel and returns focus to the chip (the panel is anchored, not triggered,
  // so the popover can't restore it); an outside click leaves focus where the user clicked.
  const refocusOnClose = useRef(false)
  useEffect(() => {
    if (detailsOpen || !refocusOnClose.current) return
    refocusOnClose.current = false
    anchorRef.current?.focus()
  }, [detailsOpen])
  const longPress = useLongPress({ onLongPress: () => setDetailsOpen(true) })
  const hintId = useId()
  const owned = unit.owned === true
  const locked = unit.owned === false
  const rarity =
    owned && unit.progression ? progressionRarity(unit.progression) : null
  const tinted = owned && shaded && unit.rank !== undefined
  const traitLabels = (unit.supportTraits ?? []).map((trait) =>
    t(`traits:${trait}`, { defaultValue: trait })
  )
  const baseLabel = owned
    ? [
        names.longName,
        rarity ? t(`progression:rarities.${rarity}`) : undefined,
        unit.rank ? t(`progression:ranks.${unit.rank}`) : undefined,
        t("common:unitTile.characterAbilities", {
          first: unit.activeLevel,
          second: unit.passiveLevel,
        }),
      ]
        .filter(Boolean)
        .join(", ")
    : locked
      ? `${names.longName}, ${t("common:unitTile.notOwned")}`
      : names.longName
  const label = [baseLabel, ...traitLabels].join(", ")

  const layout = eventUnitChipLayout({ fill, showName })
  const looks = layoutClasses(layout)

  const chip = (
    <span
      aria-label={label}
      className={cn(
        "grid min-w-0 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center rounded-md border text-left text-foreground",
        looks.root,
        // A named chip keeps room for a short name; a nameless one (the picker) is as wide as its parts.
        fill ? "w-full" : cn("max-w-40", showName && "min-w-24"),
        locked ? "border-transparent bg-muted/40" : "border-border bg-card",
        className
      )}
      data-layout={layout.kind}
      data-owned={
        unit.owned === undefined ? undefined : owned ? "true" : "false"
      }
      data-rank={unit.rank}
      data-shaded={tinted ? "true" : undefined}
      data-testid="event-board-unit"
      data-unit-id={unit.unitId}
      role="img"
      style={tinted ? chipRankTone(unit.rank) : undefined}
    >
      {showName ? (
        <span
          aria-hidden="true"
          className={cn(
            "min-w-0 truncate text-sm/4 font-semibold [grid-area:name]",
            looks.name,
            locked && "text-muted-foreground"
          )}
          data-testid="event-board-unit-name"
        >
          {names.displayName}
        </span>
      ) : null}
      <span aria-hidden="true" className="contents">
        <span
          className={cn(
            "relative shrink-0 [grid-area:portrait]",
            looks.portraitBox
          )}
        >
          <span
            className={cn(
              "block overflow-hidden rounded-full bg-portrait",
              looks.portrait,
              locked && "opacity-60 grayscale"
            )}
          >
            <EntityIcon
              alt=""
              className="size-full object-cover"
              src={characterIcon(unit.unitId as UnitId)}
            />
          </span>
          {rarity ? (
            <RarityBadge
              className={cn("absolute", looks.badge)}
              rarity={rarity}
            />
          ) : null}
        </span>
        {owned && unit.rank ? (
          <EntityIcon
            alt=""
            className={cn(
              "shrink-0 drop-shadow-[0_0_1px_rgb(0_0_0/0.6)] [grid-area:rank]",
              looks.rank
            )}
            src={rankIcon(unit.rank)}
          />
        ) : null}
        {owned ? (
          <span
            className={cn(
              "flex min-w-0 flex-col text-xs/3.5 font-bold whitespace-nowrap tabular-nums [grid-area:abilities]",
              looks.abilities
            )}
            data-testid="event-board-unit-abilities"
          >
            {/* Light, smaller letters set the numbers apart, so "A55 P60" doesn't read as one block. */}
            <span>
              <span className="text-xs font-medium">A</span>
              {unit.activeLevel}
            </span>
            <span>
              <span className="text-xs font-medium">P</span>
              {unit.passiveLevel}
            </span>
          </span>
        ) : locked ? (
          <span className="min-w-0 truncate text-xs/3.5 text-muted-foreground [grid-area:abilities]">
            {t("legendaryEvents:eventBoard.locked")}
          </span>
        ) : null}
        {unit.supportTraits?.length ? (
          <span className="ml-1 hidden gap-0.5 [grid-area:traits] @[7.5rem]:flex">
            {unit.supportTraits.map((trait) => (
              <EntityIcon
                alt=""
                className="size-5 shrink-0"
                data-testid="event-board-unit-trait"
                data-trait={trait}
                key={trait}
                src={traitIcon(trait)}
              />
            ))}
          </span>
        ) : null}
      </span>
    </span>
  )
  // Only a chip filling a column is a container query's subject: a chip sizing to its content has
  // no width of its own to query, so it picks its layout by the name alone.
  const sized =
    layout.kind === "auto" ? (
      <span className="@container block w-full min-w-0">{chip}</span>
    ) : (
      chip
    )

  // `-webkit-touch-callout` has no Tailwind utility: it keeps iOS from opening its own long-press
  // callout over ours.
  const pressStyle = { WebkitTouchCallout: "none" } as CSSProperties
  const trigger = action ? (
    <button
      {...longPress}
      aria-describedby={hintId}
      className={cn(
        "group relative block rounded-md select-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
        fill ? "w-full" : "w-auto"
      )}
      data-testid={action.testId}
      onClick={action.onActivate}
      ref={anchorRef as RefObject<HTMLButtonElement>}
      style={pressStyle}
      tabIndex={action.tabIndex}
      type="button"
    >
      {sized}
      {/* What a click does, shown where a pointer or keyboard focus can see it. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0.5 right-0.5 hidden rounded-sm bg-primary text-primary-foreground group-hover:block group-focus-visible:block"
        data-testid="event-unit-chip-start-team"
      >
        <Plus className="size-3" strokeWidth={3} />
      </span>
      <span hidden id={hintId}>
        {action.hint}
      </span>
    </button>
  ) : focusable ? (
    // Its only action is the details: a click or Enter opens the panel a long-press opens.
    <button
      {...longPress}
      aria-expanded={detailsOpen}
      aria-haspopup="dialog"
      className={cn(
        "relative flex min-w-0 rounded-md select-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
        // A 48px hit area for touch on the ~41px chip, reaching into the gap between rows.
        "pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-1",
        fill && "w-full"
      )}
      onClick={() => setDetailsOpen(true)}
      ref={anchorRef as RefObject<HTMLButtonElement>}
      style={pressStyle}
      type="button"
    >
      {sized}
    </button>
  ) : (
    <span
      {...longPress}
      className={cn("flex min-w-0 select-none", fill && "w-full")}
      ref={anchorRef}
      style={pressStyle}
    >
      {sized}
    </span>
  )
  const details = <EventUnitChipDetails longName={names.longName} unit={unit} />

  // The long-press panel mounts only while open, anchored on the chip by ref: the Event board
  // holds hundreds of chips, and a Popover root per chip measurably slowed its render.
  return (
    <>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild disableTouchToggle>
          {trigger}
        </TooltipTrigger>
        <TooltipContent className="flex-col items-start">
          {details}
        </TooltipContent>
      </Tooltip>
      {detailsOpen ? (
        <Popover onOpenChange={setDetailsOpen} open>
          <PopoverAnchor virtualRef={anchorRef} />
          <PopoverContent
            className="w-auto max-w-64 rounded-xl p-3"
            onEscapeKeyDown={() => {
              refocusOnClose.current = true
            }}
          >
            {details}
          </PopoverContent>
        </Popover>
      ) : null}
    </>
  )
}
