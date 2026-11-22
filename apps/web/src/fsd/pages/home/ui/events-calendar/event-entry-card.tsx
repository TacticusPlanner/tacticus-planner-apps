import type { ReactNode } from "react"
import { ArrowRight, ExternalLink } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
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
import { eventIcon } from "@workspace/game-catalog"

import {
  eventFamilyStripeClass,
  eventFamilySurfaceClass,
  useDateLocale,
  resolveEventFamily,
} from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"
import { EntityIcon, EventIcon } from "@/shared/ui"

import type {
  EventEntryViewModel,
  EventPhase,
  PositionedEventEntry,
} from "../../model/events-calendar.types"
import {
  eventSubjectIcons,
  resolveEventDisplayName,
} from "../../model/resolve-event-display"
import { resolveEventWikiUrl } from "../../model/event-wiki-links"
import {
  eventShopIdForOccurrence,
  resolveEventPlannerPath,
} from "../../model/event-planner-links"

const NAMESPACES = ["events", "characters", "factions", "progression"] as const

function useEventDisplayName(entry: EventEntryViewModel): string {
  const { t } = useTranslation(NAMESPACES)
  return resolveEventDisplayName(t, entry)
}

/** The faction, featured unit and rarity cap the entry's name spells out, as icons after it (the
 *  entry's own game icon, e.g. a Faction Boost's emblem, is not repeated). */
function SubjectIcons({ entry }: { entry: EventEntryViewModel }) {
  const icons = eventSubjectIcons(
    entry,
    eventIcon(entry.definitionId, entry.definitionType, entry.parameters)
  )
  if (icons.length === 0) return null
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {icons.map((icon) => (
        <EntityIcon key={icon} size="inline" alt="" src={icon} />
      ))}
    </span>
  )
}

/** Shared look of every calendar entry: family-tinted surface with a family-colored left stripe,
 *  dashed when projected, ringed (inset) while live. */
function entrySurfaceClass(entry: EventEntryViewModel): string {
  const family = resolveEventFamily(entry.definitionType)
  const isBreak = entry.definitionType === "GuildRaidBreak"
  return cn(
    // `relative` anchors the sr-only state text: without it, inside the Ongoing strip's scroller it
    // positions against the page and widens the document (pushing the fixed bottom nav off-screen).
    "relative border border-l-4 text-foreground transition-colors",
    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
    // A break between Guild Raid seasons keeps the guild stripe on a plain surface: nothing to raid.
    isBreak ? "bg-muted/40 hover:bg-muted" : eventFamilySurfaceClass(family),
    eventFamilyStripeClass(family),
    entry.isPast && "opacity-55 grayscale hover:opacity-80",
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

/** The popover's link to the entry's planner page (HSE, HRE, Quest, event shop, ...), if it has one. */
function PlannerLink({ entry }: { entry: EventEntryViewModel }) {
  if (entry.definitionType === "ShopEvent") {
    return <EventShopPlannerLink entry={entry} />
  }
  return <PlannerLinkButton to={resolveEventPlannerPath(entry)} />
}

/** An event shop occurrence links to its own shop, found in the served event shops. */
function EventShopPlannerLink({ entry }: { entry: EventEntryViewModel }) {
  const shops = useCatalogDataset("event-shops")
  const shopId =
    shops.status === "ready"
      ? eventShopIdForOccurrence(entry, shops.data)
      : undefined
  return <PlannerLinkButton to={resolveEventPlannerPath(entry, shopId)} />
}

function PlannerLinkButton({ to }: { to: string | undefined }) {
  const { t } = useTranslation("events")
  if (!to) return null
  return (
    <Button asChild size="xs">
      <Link data-testid="event-planner-link" to={to}>
        {t("plannerLink")}
        <ArrowRight data-icon="inline-end" />
      </Link>
    </Button>
  )
}

/** Opens an entry's details: full name, local dates, live/projected state, its planner page and its
 *  Wiki link. The trigger is the entry itself, so the actions no longer crowd the bar. */
function EventDetailsPopover({
  entry,
  children,
}: {
  entry: EventEntryViewModel
  children: ReactNode
}) {
  const { t } = useTranslation("events")
  const dateLocale = useDateLocale()
  const displayName = useEventDisplayName(entry)
  const wikiUrl = resolveEventWikiUrl(entry.definitionId)
  const range = new Intl.DateTimeFormat(dateLocale, {
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
              size="tile"
              className="shrink-0"
              definitionId={entry.definitionId}
              definitionType={entry.definitionType}
              parameters={entry.parameters}
            />
            <PopoverTitle>{displayName}</PopoverTitle>
            <SubjectIcons entry={entry} />
          </div>
          <PopoverDescription>{range}</PopoverDescription>
        </PopoverHeader>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {entry.isActiveNow ? <Badge>{t("badges.active")}</Badge> : null}
          {entry.confirmed ? null : (
            <Badge variant="outline">{t("badges.projected")}</Badge>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {wikiUrl ? (
              <Button asChild size="xs" variant="outline">
                <a href={wikiUrl} rel="noopener noreferrer" target="_blank">
                  {t("wikiLink")}
                  <ExternalLink data-icon="inline-end" />
                </a>
              </Button>
            ) : null}
            <PlannerLink entry={entry} />
          </div>
        </div>
        {entry.phases.length > 0 ? <PhaseList phases={entry.phases} /> : null}
        {entry.confirmed ? null : (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("details.projectedNote")}
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** A Guild War season's wars in the details popover: each war's preparation and war windows. */
function PhaseList({ phases }: { phases: EventPhase[] }) {
  const { t } = useTranslation("events")
  const dateLocale = useDateLocale()
  const formatter = new Intl.DateTimeFormat(dateLocale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
  const wars = [...new Set(phases.map((phase) => phase.war))]

  return (
    <section className="mt-3" data-testid="event-phases">
      <h4 className="mb-1 text-xs font-medium">{t("details.phases.title")}</h4>
      <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground tabular-nums">
        {wars.map((war) => (
          <li className="flex flex-wrap gap-x-2" key={war}>
            <span className="font-medium text-foreground">
              {t("details.phases.row", { war })}
            </span>
            {phases
              .filter((phase) => phase.war === war)
              .map((phase) => (
                <span key={phase.kind}>
                  {t(`details.phases.${phase.kind}`)}{" "}
                  {formatter.formatRange(
                    new Date(phase.startUtc),
                    new Date(phase.endUtc)
                  )}
                </span>
              ))}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** War windows drawn as darker blocks across the bar, placed by time within the bar's day window. */
function PhaseOverlay({ entry }: { entry: PositionedEventEntry }) {
  const { t } = useTranslation("events")
  const windowMs = entry.barEndMs - entry.barStartMs
  if (windowMs <= 0) return null

  return (
    <>
      {entry.phases
        .filter((phase) => phase.kind === "war")
        .map((phase) => {
          const startMs = Math.max(Date.parse(phase.startUtc), entry.barStartMs)
          const endMs = Math.min(Date.parse(phase.endUtc), entry.barEndMs)
          if (endMs <= startMs) return null
          return (
            <span
              aria-hidden="true"
              className="absolute inset-y-0 -z-10 bg-(--event-family-guild)/35"
              data-testid="event-war-phase"
              key={phase.startUtc}
              title={t("details.phases.row", { war: phase.war })}
              style={{
                left: `${((startMs - entry.barStartMs) / windowMs) * 100}%`,
                width: `${((endMs - startMs) / windowMs) * 100}%`,
              }}
            />
          )
        })}
    </>
  )
}

/** Desktop Gantt bar. A one-day bar shows only the game icon; its name stays for assistive tech and
 *  in the tooltip and popover. A Guild Raid break always reads "Break", with a small muted glyph.
 *  `compact` is the month grid's shorter bar. */
export function EventBar({
  entry,
  iconOnly = false,
  compact = false,
}: {
  entry: PositionedEventEntry
  iconOnly?: boolean
  compact?: boolean
}) {
  const { t } = useTranslation("events")
  const displayName = useEventDisplayName(entry)
  const isBreak = entry.definitionType === "GuildRaidBreak"
  const showIconOnly = iconOnly && !isBreak

  return (
    <EventDetailsPopover entry={entry}>
      <button
        className={cn(
          "isolate flex size-full min-w-0 items-center gap-1.5 overflow-hidden rounded-md pr-2 pl-0.5 text-left text-xs font-medium",
          showIconOnly && "justify-center px-0",
          isBreak && "justify-center pl-1 text-muted-foreground",
          entrySurfaceClass(entry)
        )}
        data-active={entry.isActiveNow}
        data-confirmed={entry.confirmed}
        data-testid="event-entry-card"
        title={displayName}
        type="button"
      >
        {entry.phases.length > 0 ? <PhaseOverlay entry={entry} /> : null}
        <EventIcon
          size={isBreak || compact ? "inline" : "row"}
          className="shrink-0"
          definitionId={entry.definitionId}
          definitionType={entry.definitionType}
          parameters={entry.parameters}
        />
        {isBreak ? (
          <>
            <span aria-hidden="true" className="truncate">
              {t("badges.break")}
            </span>
            <span className="sr-only">{displayName}</span>
          </>
        ) : (
          <>
            <span className={showIconOnly ? "sr-only" : "min-w-0 truncate"}>
              {displayName}
            </span>
            {showIconOnly ? null : <SubjectIcons entry={entry} />}
          </>
        )}
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
          "flex w-full min-w-0 items-center gap-2 rounded-lg py-1 pr-2 pl-1 text-left text-sm pointer-coarse:min-h-11",
          entrySurfaceClass(entry)
        )}
        data-active={entry.isActiveNow}
        data-confirmed={entry.confirmed}
        data-testid="event-entry-card"
        type="button"
      >
        <EventIcon
          size="row"
          className="shrink-0"
          definitionId={entry.definitionId}
          definitionType={entry.definitionType}
          parameters={entry.parameters}
        />
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="min-w-0 truncate font-medium">{displayName}</span>
          <SubjectIcons entry={entry} />
        </span>
        {isOccurrenceStart ? (
          <span
            className="shrink-0 text-xs font-semibold text-primary"
            data-testid="event-occurrence-start-badge"
          >
            {t("badges.starts")}
          </span>
        ) : null}
        {isOccurrenceEnd ? (
          <span
            className="shrink-0 text-xs font-semibold text-muted-foreground"
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
          "flex w-28 shrink-0 flex-col items-center gap-1 rounded-lg px-1.5 py-2 text-center text-xs/tight",
          entrySurfaceClass(entry)
        )}
        data-active={entry.isActiveNow}
        data-confirmed={entry.confirmed}
        data-testid="event-entry-card"
        type="button"
      >
        <EventIcon
          size="tile"
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
