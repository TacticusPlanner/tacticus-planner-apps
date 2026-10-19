import { useId, type ReactNode } from "react"
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
      <ul
        className={cn(
          "min-w-0 gap-2 p-2",
          isMobile ? "grid grid-cols-4" : "flex flex-wrap"
        )}
        data-testid="tier-list-tiles"
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
