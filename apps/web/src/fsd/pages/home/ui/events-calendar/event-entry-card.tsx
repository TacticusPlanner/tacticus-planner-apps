import type { ReactNode } from "react"
import { ExternalLink } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import { eventFamilyStripeClass, resolveEventFamily } from "@/shared/lib"
import { EventIcon } from "@/shared/ui"

import type { EventEntryViewModel } from "../../model/events-calendar.types"
import { resolveEventDisplayName } from "../../model/resolve-event-display"
import { resolveEventWikiUrl } from "../../model/event-wiki-links"

const NAMESPACES = ["events", "characters", "factions", "progression"] as const

function useEventDisplayName(entry: EventEntryViewModel): string {
  const { t } = useTranslation(NAMESPACES)
  return resolveEventDisplayName(t, entry)
}

/** Shared look of every calendar entry: neutral surface, family-colored left stripe, dashed when
 *  projected, ringed (inset) while live. */
function entrySurfaceClass(entry: EventEntryViewModel): string {
  return cn(
    // `relative` anchors the sr-only state text: without it, inside the Ongoing strip's scroller it
    // positions against the page and widens the document (pushing the fixed bottom nav off-screen).
    "relative border border-l-4 bg-muted/50 text-foreground transition-colors hover:bg-muted",
    "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
    eventFamilyStripeClass(resolveEventFamily(entry.definitionType)),
    entry.confirmed
      ? "border-y-transparent border-r-transparent"
      : "border-dashed",
    // Inset so a live entry stays inside its column instead of overhanging the card's padding.
    entry.isActiveNow && "ring-2 ring-primary ring-inset"
  )
}

/** Screen-reader-only state the surface shows visually (live ring, dashed projected border). */
function EntryStateText({ entry }: { entry: EventEntryViewModel }) {
  const { t } = useTranslation("events")
  return (
    <>
      {entry.isActiveNow ? (
        <span className="sr-only" data-testid="event-active-badge">
          {t("badges.active")}
        </span>
      ) : null}
      <span className="sr-only" data-testid="event-confirmed-badge">
        {entry.confirmed ? t("badges.confirmed") : t("badges.projected")}
      </span>
    </>
  )
}

/** Opens an entry's details: full name, local dates, live/projected state and its Wiki link. The
 *  trigger is the entry itself, so the Wiki action no longer crowds the bar. */
function EventDetailsPopover({
  entry,
  children,
}: {
  entry: EventEntryViewModel
  children: ReactNode
}) {
  const { t, i18n } = useTranslation("events")
  const displayName = useEventDisplayName(entry)
  const wikiUrl = resolveEventWikiUrl(entry.definitionId)
  const range = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: "medium",
    timeStyle: "short",
  }).formatRange(new Date(entry.startUtc), new Date(entry.endUtc))

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72"
        data-testid="event-details"
      >
        <PopoverHeader>
          <div className="flex items-center gap-3">
            <EventIcon
              className="size-10 shrink-0"
              definitionId={entry.definitionId}
              definitionType={entry.definitionType}
              parameters={entry.parameters}
            />
            <PopoverTitle>{displayName}</PopoverTitle>
          </div>
          <PopoverDescription>{range}</PopoverDescription>
        </PopoverHeader>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {entry.isActiveNow ? <Badge>{t("badges.active")}</Badge> : null}
          {entry.confirmed ? null : (
            <Badge variant="outline">{t("badges.projected")}</Badge>
          )}
          {wikiUrl ? (
            <Button asChild className="ml-auto" size="xs" variant="outline">
              <a href={wikiUrl} rel="noopener noreferrer" target="_blank">
                {t("wikiLink")}
                <ExternalLink data-icon="inline-end" />
              </a>
            </Button>
          ) : null}
        </div>
        {entry.confirmed ? null : (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("details.projectedNote")}
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** Desktop Gantt bar. A one-day bar shows only the game icon; its name stays for assistive tech and
 *  in the tooltip and popover. */
export function EventBar({
  entry,
  iconOnly = false,
}: {
  entry: EventEntryViewModel
  iconOnly?: boolean
}) {
  const displayName = useEventDisplayName(entry)

  return (
    <EventDetailsPopover entry={entry}>
      <button
        className={cn(
          "flex h-full w-full min-w-0 items-center gap-1.5 rounded-md pr-2 pl-0.5 text-left text-xs font-medium",
          iconOnly && "justify-center px-0",
          entrySurfaceClass(entry)
        )}
        data-active={entry.isActiveNow}
        data-confirmed={entry.confirmed}
        data-testid="event-entry-card"
        title={displayName}
        type="button"
      >
        <EventIcon
          className="size-7 shrink-0"
          definitionId={entry.definitionId}
          definitionType={entry.definitionType}
          parameters={entry.parameters}
        />
        <span className={iconOnly ? "sr-only" : "min-w-0 flex-1 truncate"}>
          {displayName}
        </span>
        <EntryStateText entry={entry} />
      </button>
    </EventDetailsPopover>
  )
}

/** Mobile agenda row: the entry under the day it starts or ends on (or its only day). */
export function EventAgendaRow({
  entry,
  isOccurrenceEnd = false,
  isOccurrenceStart = false,
}: {
  entry: EventEntryViewModel
  isOccurrenceEnd?: boolean
  isOccurrenceStart?: boolean
}) {
  const { t } = useTranslation("events")
  const displayName = useEventDisplayName(entry)

  return (
    <EventDetailsPopover entry={entry}>
      <button
        className={cn(
          "flex w-full min-w-0 items-center gap-2 rounded-lg py-1 pr-2 pl-1 text-left text-sm",
          entrySurfaceClass(entry)
        )}
        data-active={entry.isActiveNow}
        data-confirmed={entry.confirmed}
        data-testid="event-entry-card"
        type="button"
      >
        <EventIcon
          className="size-8 shrink-0"
          definitionId={entry.definitionId}
          definitionType={entry.definitionType}
          parameters={entry.parameters}
        />
        <span className="min-w-0 flex-1 truncate font-medium">
          {displayName}
        </span>
        {isOccurrenceStart ? (
          <span
            className="shrink-0 text-[11px] font-semibold tracking-wide text-primary uppercase"
            data-testid="event-occurrence-start-badge"
          >
            {t("badges.starts")}
          </span>
        ) : null}
        {isOccurrenceEnd ? (
          <span
            className="shrink-0 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
            data-testid="event-occurrence-end-badge"
          >
            {t("badges.ends")}
          </span>
        ) : null}
        <EntryStateText entry={entry} />
      </button>
    </EventDetailsPopover>
  )
}

/** Mobile "Ongoing" tile: an occurrence carried into the range, shown once with when it ends. */
export function OngoingEventTile({
  entry,
  endsInText,
}: {
  entry: EventEntryViewModel
  endsInText: string
}) {
  const displayName = useEventDisplayName(entry)

  return (
    <EventDetailsPopover entry={entry}>
      <button
        className={cn(
          "flex w-28 shrink-0 flex-col items-center gap-1 rounded-lg px-1.5 py-2 text-center text-xs leading-tight",
          entrySurfaceClass(entry)
        )}
        data-active={entry.isActiveNow}
        data-confirmed={entry.confirmed}
        data-testid="event-entry-card"
        type="button"
      >
        <EventIcon
          className="size-10"
          definitionId={entry.definitionId}
          definitionType={entry.definitionType}
          parameters={entry.parameters}
        />
        <span className="line-clamp-2 font-medium">{displayName}</span>
        <span className="text-muted-foreground tabular-nums">{endsInText}</span>
        <EntryStateText entry={entry} />
      </button>
    </EventDetailsPopover>
  )
}
