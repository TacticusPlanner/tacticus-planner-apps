import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type {
  LegendaryEvent,
  LegendaryEventLifecycle,
} from "@/entities/legendary-event"
import { RunInputsDrawer } from "@/features/legendary-event-run-inputs"
import { formatEventCountdown, formatRelativeTime } from "@/shared/lib"

import { EventTimingLines } from "../shared/event-timing-lines"
import type {
  RewardOutlookViewModel,
  RunInputsViewModel,
  RunStatusViewModel,
} from "./legendary-event-page.view-model"
import { RewardOutlook } from "./reward-outlook"

/** The event's run status from the last sync, the Inputs drawer (signed in) and the Reward
 *  outlook. Refreshing is the shell's Sync action; there is deliberately no sync control here
 *  (design D8). */
export function RunStatusCard({
  event,
  lifecycle,
  nowMs,
  runStatus,
  outlook,
  runInputs,
  syncedAtMs,
  isMobile,
}: {
  event: Pick<LegendaryEvent, "id" | "regularMissions" | "premiumMissions">
  lifecycle: LegendaryEventLifecycle
  nowMs: number
  runStatus: RunStatusViewModel
  outlook: RewardOutlookViewModel
  runInputs: RunInputsViewModel
  /** `null` before the first sync; `undefined` while unknown, which hides the line. */
  syncedAtMs: number | null | undefined
  isMobile: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)

  const body = (() => {
    if (runStatus.kind === "loading") {
      return (
        <Skeleton
          className="h-16 w-full rounded-lg"
          data-testid="run-status-loading"
        />
      )
    }
    if (runStatus.kind === "unavailable") {
      return (
        <p
          className="text-sm text-muted-foreground"
          data-testid="run-status-unavailable"
        >
          {t("runStatus.syncedUnavailable")}
        </p>
      )
    }
    if (runStatus.kind === "noEntry") {
      return (
        <p
          className="text-sm text-muted-foreground"
          data-testid="run-status-no-entry"
        >
          {t("runStatus.noEntry")}
        </p>
      )
    }
    const { tokens, milestone } = runStatus
    const tokensText = tokens
      ? t("tokens", { current: tokens.current, max: tokens.max })
      : undefined
    return (
      <ul
        className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2"
        data-testid="run-status-values"
      >
        {runStatus.run === null ? null : (
          <Value testId="run-status-run">
            {t("run", { run: runStatus.run })}
          </Value>
        )}
        {tokens && tokensText ? (
          <Value testId="run-status-tokens">
            {tokens.next === null
              ? tokensText
              : tokens.next.kind === "due"
                ? t("runStatus.tokensDue", { tokens: tokensText })
                : t("runStatus.tokensNext", {
                    tokens: tokensText,
                    when: formatEventCountdown(
                      tokens.next.targetMs,
                      nowMs,
                      i18n.language
                    ),
                  })}
          </Value>
        ) : null}
        <Value testId="run-status-points">
          {t("points", { points: number.format(runStatus.points) })}
        </Value>
        <Value testId="run-status-currency">
          {t("runStatus.currency", {
            value: number.format(runStatus.currency),
          })}
        </Value>
        <Value testId="run-status-chests">
          {t("runStatus.chests", {
            value: number.format(runStatus.chestsClaimed),
          })}
        </Value>
        <Value testId="run-status-shards">
          {t("runStatus.shards", { value: number.format(runStatus.shards) })}
        </Value>
        <Value className="sm:col-span-2" testId="run-status-milestone">
          <span className="text-muted-foreground">
            {t("runStatus.milestoneLabel")}:{" "}
          </span>
          {milestone
            ? t("runStatus.milestone", {
                points: number.format(milestone.pointsToGo),
                milestone: milestone.milestone,
                currency: number.format(milestone.engramPayout),
              })
            : t("runStatus.noMilestone")}
        </Value>
      </ul>
    )
  })()

  return (
    <Card data-testid="legendary-event-run-status">
      <CardHeader>
        <CardTitle>
          <h2>{t("runStatus.title")}</h2>
        </CardTitle>
        {runInputs.enabled ? (
          <CardAction>
            <RunInputsDrawer
              currentRun={runInputs.currentRun}
              event={event}
              isMobile={isMobile}
            />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <EventTimingLines lifecycle={lifecycle} nowMs={nowMs} />
        {body}
        <RewardOutlook outlook={outlook} />
        {syncedAtMs === undefined ? null : (
          <p
            className="text-xs text-muted-foreground"
            data-testid="run-status-synced-at"
          >
            {syncedAtMs === null
              ? t("runStatus.neverSynced")
              : t("runStatus.syncedAgo", {
                  when: formatRelativeTime(syncedAtMs, i18n.language),
                })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function Value({
  children,
  className,
  testId,
}: {
  children: ReactNode
  className?: string
  testId: string
}) {
  return (
    <li className={className} data-testid={testId}>
      {children}
    </li>
  )
}
