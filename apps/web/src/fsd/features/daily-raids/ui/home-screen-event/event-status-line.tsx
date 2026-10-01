import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Spinner } from "@workspace/ui/components/spinner"

import { eventBarClass, formatRelativeTime } from "@/shared/lib"
import { EventTypeIcon } from "@/shared/ui"

import { hasHomeScreenEventRule } from "../../model/home-screen-event-rules"
import type { ActiveHomeScreenEventState } from "../../model/use-active-home-screen-event"

/**
 * What the HSE tab says about the event: the running one (name, remaining time, whether it earns
 * raid points), the next one when nothing runs, or why there is nothing to show. An upcoming event
 * is only ever announced here; it changes no ordering anywhere.
 */
export function EventStatusLine({
  state,
}: {
  state: ActiveHomeScreenEventState
}) {
  const { t, i18n } = useTranslation(["dailies", "events"])
  const eventName = (definitionId: string) =>
    t(`events:definitions.${definitionId}`, { defaultValue: definitionId })

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

  if (state.active) {
    const when = formatRelativeTime(
      Date.parse(state.active.endUtc),
      i18n.language
    )
    return (
      <StatusFrame testId="hse-status-active">
        <p className="font-semibold">{eventName(state.active.definitionId)}</p>
        <p className="text-sm text-muted-foreground">
          {t("dailies:hse.status.endsIn", { when })}
        </p>
        <p className="text-sm">
          {hasHomeScreenEventRule(state.active.definitionId)
            ? t("dailies:hse.status.earnsPoints")
            : t("dailies:hse.status.noRaidPoints")}
        </p>
      </StatusFrame>
    )
  }

  if (state.next) {
    const startMs = Date.parse(state.next.startUtc)
    return (
      <StatusFrame testId="hse-status-next">
        <p className="text-sm text-muted-foreground">
          {t("dailies:hse.status.noneRunning")}
        </p>
        <p className="font-semibold">
          {t("dailies:hse.status.next", {
            name: eventName(state.next.definitionId),
          })}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("dailies:hse.status.startsIn", {
            when: formatRelativeTime(startMs, i18n.language),
            date: new Date(startMs).toLocaleString(i18n.language, {
              dateStyle: "medium",
              timeStyle: "short",
            }),
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
  testId,
  children,
}: {
  testId: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3" data-testid={testId}>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md",
          eventBarClass("homeScreen")
        )}
      >
        <EventTypeIcon className="size-5" definitionType="HomeScreenEvent" />
      </span>
      <div className="min-w-0 space-y-0.5">{children}</div>
    </div>
  )
}
