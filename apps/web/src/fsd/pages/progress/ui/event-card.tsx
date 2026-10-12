import { useTranslation } from "react-i18next"
import { campaignIcon, characterIcon } from "@workspace/game-catalog"
import type { CampaignId, UnitId } from "@workspace/game-domain"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import { eventTypes, type EventView } from "../model/campaign-events.model"
import { EventTrackEditor, type PatchTrack } from "./event-track-editor"

function EventSummary({ view }: { view: EventView }) {
  const { t } = useTranslation(["common", "campaigns"])
  const { event, summary } = view
  const name = t(`campaigns:names.${event.nameKey}`, {
    defaultValue: event.nameKey,
  })
  const part = (label: string, value: { done: number; total: number }) =>
    t("progress.events.summary.track", { label, ...value })
  const parts = [
    ...(summary.standard.total > 0
      ? [part(t("campaigns:difficulties.eventStandard"), summary.standard)]
      : []),
    ...(summary.extremis.total > 0
      ? [part(t("campaigns:difficulties.eventExtremis"), summary.extremis)]
      : []),
    ...(summary.challenges.total > 0
      ? [part(t("progress.events.summary.challenges"), summary.challenges)]
      : []),
  ]
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <EntityIcon
        src={campaignIcon(event.definition.groupId as CampaignId, "Standard")}
        alt=""
        className="size-10 shrink-0"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{name}</span>
          {view.completed ? (
            <Badge variant="secondary">{t("progress.events.completed")}</Badge>
          ) : null}
          {summary.hasManual ? (
            <Badge data-testid="event-has-manual">
              {t("progress.events.source.manual")}
            </Badge>
          ) : null}
          {summary.hasNoData ? (
            <Badge
              variant="outline"
              className="text-muted-foreground"
              data-testid="event-has-no-data"
            >
              {t("progress.events.source.none")}
            </Badge>
          ) : null}
        </div>
        <ul
          className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground tabular-nums"
          data-testid="event-summary"
        >
          {parts.map((text) => (
            <li key={text} className="whitespace-nowrap">
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function EventDetails({
  view,
  onPatch,
  testIdPrefix,
}: {
  view: EventView
  onPatch: PatchTrack
  testIdPrefix: string
}) {
  const { t } = useTranslation(["common", "characters"])
  const isMobile = useIsMobile()
  const { event } = view
  return (
    <div className="space-y-4">
      {event.coreCharacters.length > 0 ? (
        <div className="space-y-2" data-testid={`${testIdPrefix}-core`}>
          <h4 className="text-sm font-medium">
            {t("progress.events.coreCharacters")}
          </h4>
          <ul className="flex flex-wrap gap-1.5">
            {event.coreCharacters.map(({ id, owned }) => {
              const name = t(`characters:${id}`, { defaultValue: id })
              const label = owned
                ? name
                : t("progress.events.notOwned", { name })
              return (
                <li
                  key={id}
                  title={label}
                  data-owned={owned ? "true" : "false"}
                >
                  <EntityIcon
                    src={characterIcon(id as UnitId)}
                    alt={label}
                    className={cn(
                      "size-9 rounded",
                      !owned && "opacity-40 grayscale"
                    )}
                  />
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
      <div
        className={cn("grid gap-4", !isMobile && "grid-cols-2")}
        data-testid={`${testIdPrefix}-tracks`}
        data-layout={isMobile ? "stacked" : "columns"}
      >
        {eventTypes.map((type) => (
          <EventTrackEditor
            key={type}
            groupId={event.definition.groupId}
            type={type}
            track={view.tracks[type]}
            onPatch={onPatch}
            testIdPrefix={testIdPrefix}
          />
        ))}
      </div>
    </div>
  )
}

export function CurrentEventCard({
  view,
  onPatch,
}: {
  view: EventView
  onPatch: PatchTrack
}) {
  const { t } = useTranslation()
  return (
    <Card data-testid="current-event">
      <CardHeader className="space-y-3">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
          {t("progress.events.currentEvent")}
        </CardTitle>
        <EventSummary view={view} />
      </CardHeader>
      <CardContent>
        <EventDetails
          view={view}
          onPatch={onPatch}
          testIdPrefix="current-event"
        />
      </CardContent>
    </Card>
  )
}

export function EventListItem({
  view,
  onPatch,
}: {
  view: EventView
  onPatch: PatchTrack
}) {
  const groupId = view.event.definition.groupId
  const testIdPrefix = `campaign-event-${groupId}`
  return (
    <AccordionItem value={groupId} data-testid={testIdPrefix}>
      <AccordionTrigger
        className="items-center hover:no-underline"
        data-testid={`${testIdPrefix}-trigger`}
      >
        <EventSummary view={view} />
      </AccordionTrigger>
      <AccordionContent>
        <EventDetails
          view={view}
          onPatch={onPatch}
          testIdPrefix={testIdPrefix}
        />
      </AccordionContent>
    </AccordionItem>
  )
}
