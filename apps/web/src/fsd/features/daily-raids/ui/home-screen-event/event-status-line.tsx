import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { gameMenuIcon } from "@workspace/game-catalog"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Spinner } from "@workspace/ui/components/spinner"

import { formatRelativeTime, useDateLocale } from "@/shared/lib"
import { EntityIcon, EventIcon } from "@/shared/ui"

import {
  homeScreenEventInstanceKey,
  type HomeScreenEventEntry,
  type HomeScreenEventInstance,
} from "../../model/select-active-home-screen-event"
import type { ActiveHomeScreenEventState } from "../../model/use-active-home-screen-event"
import { useHomeScreenEventName } from "./use-home-screen-event-name"

/**
 * What the HSE tab says about the shown instance: a running one (name, remaining time, whether it
 * earns raid points), an upcoming one (name, start date and countdown), a past one (name and "Ended
 * on" date), or why there is nothing to show. Showing an instance changes no ordering anywhere.
 */
export function EventStatusLine({
  state,
  instance,
}: {
  state: ActiveHomeScreenEventState
  /** The instance the tab shows (see `resolveHomeScreenEventSelection`), or null for none. */
  instance: HomeScreenEventInstance<HomeScreenEventEntry> | null
}) {
  const { t, i18n } = useTranslation(["dailies"])
  const dateLocale = useDateLocale()
  const eventName = useHomeScreenEventName()
  const formatDate = (ms: number) =>
    new Date(ms).toLocaleString(dateLocale, {
      dateStyle: "medium",
      timeStyle: "short",
    })

  if (state.status === "loading") {
    return (
      <div
        className="flex min-h-12 items-center"
        data-testid="hse-status-loading"
      >
        <Spinner className="size-5" />
      </div>
    )
  }
  if (state.status === "error") {
    return (
      <Alert data-testid="hse-status-error" variant="destructive">
        <AlertDescription>{t("dailies:hse.status.error")}</AlertDescription>
      </Alert>
    )
  }

  if (instance?.status === "running") {
    const when = formatRelativeTime(
      Date.parse(instance.entry.endUtc),
      i18n.language
    )
    return (
      <StatusFrame entry={instance.entry} testId="hse-status-active">
        <p className="font-semibold">{eventName(instance.entry)}</p>
        <p className="text-sm text-muted-foreground">
          {t("dailies:hse.status.endsIn", { when })}
        </p>
        <p className="text-sm">
          {instance.raidRule
            ? t("dailies:hse.status.earnsPoints")
            : t("dailies:hse.status.noRaidPoints")}
        </p>
      </StatusFrame>
    )
  }

  if (instance?.status === "upcoming") {
    const startMs = Date.parse(instance.entry.startUtc)
    const noneRunning = !state.instances.some(
      (candidate) => candidate.status === "running"
    )
    const isNext =
      state.next !== null &&
      homeScreenEventInstanceKey(state.next) === instance.key
    const name = eventName(instance.entry)
    return (
      <StatusFrame entry={instance.entry} testId="hse-status-upcoming">
        {noneRunning ? (
          <p className="text-sm text-muted-foreground">
            {t("dailies:hse.status.noneRunning")}
          </p>
        ) : null}
        <p className="font-semibold">
          {isNext ? t("dailies:hse.status.next", { name }) : name}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("dailies:hse.status.startsIn", {
            when: formatRelativeTime(startMs, i18n.language),
            date: formatDate(startMs),
          })}
        </p>
      </StatusFrame>
    )
  }

  if (instance?.status === "past") {
    return (
      <StatusFrame entry={instance.entry} testId="hse-status-past">
        <p className="font-semibold">{eventName(instance.entry)}</p>
        <p className="text-sm text-muted-foreground">
          {t("dailies:hse.status.endedOn", {
            date: formatDate(Date.parse(instance.entry.endUtc)),
          })}
        </p>
      </StatusFrame>
    )
  }

  return (
    <StatusFrame testId="hse-status-none">
      <p className="text-sm text-muted-foreground">
        {t("dailies:hse.status.noneScheduled")}
      </p>
    </StatusFrame>
  )
}

function StatusFrame({
  entry,
  testId,
  children,
}: {
  /** The shown instance, for its game medallion; none falls back to the generic HSE icon. */
  entry?: HomeScreenEventEntry
  testId: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3" data-testid={testId}>
      {entry ? (
        <EventIcon
          className="size-12 shrink-0"
          definitionId={entry.definitionId}
          definitionType="HomeScreenEvent"
          parameters={entry.parameters ?? null}
        />
      ) : (
        <EntityIcon
          alt=""
          className="size-9 shrink-0"
          src={gameMenuIcon("homeScreenEvent")}
        />
      )}
      <div className="min-w-0 space-y-0.5">{children}</div>
    </div>
  )
}
