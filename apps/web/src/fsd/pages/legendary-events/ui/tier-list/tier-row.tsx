import {
  useId,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

import { tierToneClass } from "@/entities/legendary-event"

/** "S · 1.85×": the tier name stands out, the separator is read but not shown. */
function TierLabel({
  name,
  multiplier,
  isMobile,
}: {
  name: string
  multiplier: string
  isMobile: boolean
}) {
  return (
    <>
      <span className={cn("font-bold", !isMobile && "text-xl")}>{name}</span>
      <span className={isMobile ? undefined : "sr-only"}> · </span>
      <span
        className={cn(
          "text-muted-foreground tabular-nums",
          !isMobile && "text-xs"
        )}
      >
        {multiplier}
      </span>
    </>
  )
}

// ponytail: roving focus is wired here through the DOM because the Tier List is the only operable
// tile grid; extract a shared `useRovingFocus` hook into shared/lib when a second one appears.
const ROVING_ROW = "ul[data-roving-row]"

/** The tile buttons of a row, in order: each `<li>` holds one tile button. */
function tilesOf(row: Element) {
  return Array.from(row.children, (item) => item.firstElementChild).filter(
    (tile): tile is HTMLElement => tile instanceof HTMLElement
  )
}

/** Keeps exactly one tile of the row in the tab order: the last focused one, else the first. */
function syncTabStop(row: Element, active?: Element) {
  const tiles = tilesOf(row)
  const current =
    (active && tiles.find((tile) => tile === active)) ??
    tiles.find((tile) => tile.getAttribute("tabindex") === "0") ??
    tiles[0]
  for (const tile of tiles) tile.tabIndex = tile === current ? 0 : -1
}

function moveFocus(event: KeyboardEvent<HTMLUListElement>) {
  const row = event.currentTarget
  const tiles = tilesOf(row)
  const index = tiles.indexOf(event.target as HTMLElement)
  // Keys from a tile's portalled details popover bubble here too; leave them alone.
  if (index < 0) return
  let target: HTMLElement | undefined
  switch (event.key) {
    case "ArrowLeft":
      target = tiles[Math.max(index - 1, 0)]
      break
    case "ArrowRight":
      target = tiles[Math.min(index + 1, tiles.length - 1)]
      break
    case "Home":
      target = tiles[0]
      break
    case "End":
      target = tiles.at(-1)
      break
    case "ArrowUp":
    case "ArrowDown": {
      const rows = Array.from(
        row.closest("section")?.parentElement?.querySelectorAll(ROVING_ROW) ??
          []
      )
      const next =
        rows[rows.indexOf(row) + (event.key === "ArrowDown" ? 1 : -1)]
      const nextTiles = next ? tilesOf(next) : []
      target = nextTiles[Math.min(index, nextTiles.length - 1)]
      break
    }
    default:
      return
  }
  event.preventDefault()
  target?.focus()
}

/** One tier: on desktop a horizontal band (fixed-width coloured label cell, tiles wrapping to the
 *  right); on mobile a full-width section with the label as its header and a four-column grid. An
 *  empty row stays visible with "No character". */
export function TierRow({
  name,
  multiplier,
  tone,
  isMobile,
  testId,
  isEmpty,
  header,
  bodyId,
  collapsed,
  children,
}: {
  name: string
  multiplier: string
  /** The tier's catalog name (S, A, B, C) for its colour; undefined for Untiered. */
  tone: string | undefined
  isMobile: boolean
  testId: string
  isEmpty: boolean
  /** Replaces the heading content (the Untiered row's toggle). */
  header?: (label: ReactNode) => ReactNode
  bodyId?: string
  /** Shown in place of the tiles while a collapsed row hides them. */
  collapsed?: ReactNode
  /** The tiles, as list items; omitted while a collapsed row hides them. */
  children?: ReactNode
}) {
  const { t } = useTranslation("legendaryEvents")
  const tilesRef = useRef<HTMLUListElement>(null)
  // No deps: the tiles arrive as children, so re-check the tab stop after every render.
  useLayoutEffect(() => {
    if (tilesRef.current) syncTabStop(tilesRef.current)
  })
  const toneClass = tierToneClass(tone)
  const label = (
    <TierLabel isMobile={isMobile} multiplier={multiplier} name={name} />
  )
  let body: ReactNode = collapsed ?? null
  if (children !== undefined) {
    body = isEmpty ? (
      <p
        className="p-3 text-sm text-muted-foreground"
        data-testid="tier-list-row-empty"
      >
        {t("tierList.noCharacter")}
      </p>
    ) : (
      // The list only delegates focus and arrow keys from its tile buttons; it is not a control.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <ul
        className={cn(
          "min-w-0 gap-2 p-2",
          isMobile ? "grid grid-cols-4" : "flex flex-wrap"
        )}
        data-roving-row=""
        data-testid="tier-list-tiles"
        onFocus={(event) => syncTabStop(event.currentTarget, event.target)}
        onKeyDown={moveFocus}
        ref={tilesRef}
      >
        {children}
      </ul>
    )
  }
  return (
    <section
      className={cn(
        "flex min-w-0 overflow-hidden rounded-xl border",
        isMobile ? "flex-col" : "flex-row"
      )}
      data-layout={isMobile ? "section" : "band"}
      data-testid={testId}
    >
      <h2
        className={cn(
          "flex shrink-0 items-center",
          toneClass,
          isMobile
            ? "gap-1 border-l-4 px-3 py-2 text-sm"
            : "w-24 flex-col justify-center border-r-4 p-2 text-center text-sm break-words"
        )}
        data-testid="tier-list-row-label"
      >
        {header ? header(label) : label}
      </h2>
      <div className="min-w-0 flex-1" id={bodyId}>
        {body}
      </div>
    </section>
  )
}

/** The Untiered row (1.0×): collapsed by default with its count, since it holds most of the
 *  roster; opening it lists the characters by localized name. */
export function UntieredRow({
  multiplier,
  count,
  isMobile,
  expanded,
  onExpandedChange,
  children,
}: {
  multiplier: string
  count: number
  isMobile: boolean
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  children: ReactNode
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const contentId = useId()
  return (
    <TierRow
      header={(label) => (
        <button
          aria-controls={expanded ? contentId : undefined}
          aria-expanded={expanded}
          className={cn(
            "flex min-h-11 w-full items-center gap-1 rounded-md text-left focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
            !isMobile && "flex-col justify-center text-center"
          )}
          data-testid="tier-list-untiered-toggle"
          onClick={() => onExpandedChange(!expanded)}
          type="button"
        >
          <span className={isMobile ? "contents" : "flex flex-col"}>
            {label}
          </span>
          <span
            className="rounded-full bg-background px-2 text-xs tabular-nums"
            data-testid="tier-list-untiered-count"
          >
            <span className="sr-only">
              {t("tierList.untieredCount", { count })}
            </span>
            <span aria-hidden="true">
              {new Intl.NumberFormat(i18n.language).format(count)}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 transition-transform",
              isMobile && "ml-auto",
              expanded && "rotate-180"
            )}
          />
        </button>
      )}
      isEmpty={count === 0}
      isMobile={isMobile}
      multiplier={multiplier}
      name={t("tierList.untiered")}
      testId="tier-list-untiered"
      bodyId={contentId}
      collapsed={
        isMobile ? undefined : (
          <p className="p-3 text-sm text-muted-foreground">
            {t("tierList.untieredHint")}
          </p>
        )
      }
      tone={undefined}
    >
      {expanded ? children : undefined}
    </TierRow>
  )
}
