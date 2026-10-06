import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import {
  useLegendaryEvents,
  useLegendaryEventsProgress,
} from "@/entities/legendary-event"
import { useTourPageSteps } from "@/shared/tour"
import { useUnitName } from "@/shared/unit-name"

import { LegendaryEventCard } from "./legendary-event-card"
import { useLegendaryEventsHubTutorial } from "./legendary-events-hub.tutorial"
import {
  buildHubViewModel,
  type HubCardViewModel,
  type HubViewModel,
} from "./legendary-events-hub.view-model"

const GROUPS = ["active", "upcoming", "archived"] as const

/** `/events/legendary-events`: every catalog Legendary Event under Active, Upcoming and Archived.
 *  Desktop lays the cards out as a grid, mobile as a full-width stack. */
export function LegendaryEventsHubPage() {
  const { t, i18n } = useTranslation("legendaryEvents")
  const isMobile = useIsMobile()
  const events = useLegendaryEvents()
  const progress = useLegendaryEventsProgress()
  const unitName = useUnitName()

  // Cheap to rebuild, and the unit names resolve asynchronously, so no memo.
  const view: HubViewModel | undefined =
    events.status === "ready"
      ? buildHubViewModel(
          events.data,
          progress,
          events.nowMs,
          (id) => unitName("Character", id),
          i18n.language
        )
      : undefined
  useTourPageSteps(
    useLegendaryEventsHubTutorial({
      hasActive: (view?.active.length ?? 0) > 0,
      hasUpcoming: (view?.upcoming.length ?? 0) > 0,
    })
  )

  if (events.status === "loading") {
    return (
      <div
        className="flex flex-col gap-3"
        data-testid="legendary-events-hub-loading"
      >
        <span className="sr-only">{t("hub.loading")}</span>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    )
  }
  if (events.status === "error" || !view) {
    return (
      <div
        className="flex flex-col items-start gap-3"
        data-testid="legendary-events-hub-error"
      >
        <p className="text-sm text-destructive">{t("hub.error")}</p>
        <Button onClick={events.retry} variant="outline">
          {t("hub.retry")}
        </Button>
      </div>
    )
  }
  if (GROUPS.every((group) => view[group].length === 0)) {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="legendary-events-hub-empty"
      >
        {t("hub.empty")}
      </p>
    )
  }

  return (
    <div
      className="flex min-w-0 flex-col gap-6"
      data-testid="legendary-events-hub"
    >
      {view.active.length === 0 ? (
        <p
          className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground"
          data-testid="legendary-events-no-active"
        >
          {t("hub.noActive")}
        </p>
      ) : null}
      {GROUPS.map((group) =>
        view[group].length === 0 ? null : (
          <HubGroup
            cards={view[group]}
            group={group}
            isMobile={isMobile}
            key={group}
            nowMs={events.nowMs}
            title={t(`hub.groups.${group}`)}
          />
        )
      )}
    </div>
  )
}

function HubGroup({
  cards,
  group,
  isMobile,
  nowMs,
  title,
}: {
  cards: HubCardViewModel[]
  group: (typeof GROUPS)[number]
  isMobile: boolean
  nowMs: number
  title: string
}) {
  return (
    <section
      aria-label={title}
      className="flex min-w-0 flex-col gap-3"
      data-testid={`legendary-events-group-${group}`}
    >
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <ul
        className={cn(
          "min-w-0 gap-3",
          isMobile ? "flex flex-col" : "grid grid-cols-2 xl:grid-cols-3"
        )}
        data-layout={isMobile ? "stack" : "grid"}
        data-testid="legendary-events-list"
      >
        {cards.map((card) => (
          <li className="min-w-0" key={card.eventId}>
            <LegendaryEventCard card={card} nowMs={nowMs} />
          </li>
        ))}
      </ul>
    </section>
  )
}
