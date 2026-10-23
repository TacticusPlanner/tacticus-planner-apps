import { useEffect, useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type { RunHistory } from "../../../lib/run-history"

import type { LastRunSectionViewModel } from "../legendary-event-page.view-model"
import { RUN_COUNT, type LastRunViewModel } from "./last-run.view-model"
import { RunHistoryBody, ToggleButton } from "./run-history-body"
import { useRunDate } from "./use-run-date"

/**
 * The Overview's Last run card (spec: legendary-event-run-history): the previous run's number,
 * date and event points, each lane's cleared battle, points and teams ("cleared up to", with the
 * planned depth when stored), and the Since last run roster changes; on archived and upcoming
 * events a collapsed Earlier runs list follows. Lanes sit side by side on desktop and stack on
 * mobile, where each lane's teams sit behind a "Teams (N)" toggle. `onViewed` is called when the
 * card first becomes visible (on mount where IntersectionObserver is unavailable).
 */
export function LastRunCard({
  lastRun,
  isMobile,
  onViewed,
  onEarlierExpanded,
  onEarlierEntryToggled,
  loadMore,
}: {
  lastRun: LastRunViewModel
  isMobile: boolean
} & Omit<LastRunSectionViewModel, "state">) {
  const { t } = useTranslation("legendaryEvents")

  if (lastRun.kind === "hidden") return null
  if (lastRun.kind === "noRecords") {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="legendary-event-history-note"
      >
        {t("history.noRecords")}
      </p>
    )
  }
  if (lastRun.kind === "loading") {
    return (
      <Card data-testid="legendary-event-last-run" data-state="loading">
        <CardHeader>
          <CardTitle>
            <h2>{t("history.title")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className="sr-only">{t("history.loading")}</span>
          <Skeleton
            className="h-32 w-full rounded-lg"
            data-testid="last-run-loading"
          />
        </CardContent>
      </Card>
    )
  }
  if (lastRun.kind === "error") {
    return (
      <Card data-testid="legendary-event-last-run" data-state="error">
        <CardHeader>
          <CardTitle>
            <h2>{t("history.title")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent
          className="flex flex-wrap items-center gap-3"
          data-testid="last-run-error"
          role="alert"
        >
          <p className="text-sm text-destructive">{t("history.unavailable")}</p>
          <Button onClick={lastRun.retry} size="sm" variant="outline">
            {t("history.retry")}
          </Button>
        </CardContent>
      </Card>
    )
  }
  return (
    <ReadyCard
      earlier={lastRun.earlier}
      isMobile={isMobile}
      loadMore={loadMore}
      onEarlierEntryToggled={onEarlierEntryToggled}
      onEarlierExpanded={onEarlierExpanded}
      onViewed={onViewed}
      previous={lastRun.previous}
    />
  )
}

function ReadyCard({
  previous,
  earlier,
  isMobile,
  onViewed,
  onEarlierExpanded,
  onEarlierEntryToggled,
  loadMore,
}: {
  previous: RunHistory
  earlier: RunHistory[]
  isMobile: boolean
} & Omit<LastRunSectionViewModel, "state">) {
  const { t } = useTranslation("legendaryEvents")
  const root = useRef<HTMLDivElement>(null)
  const viewed = useRef({ onViewed, previous })
  useEffect(() => {
    viewed.current = { onViewed, previous }
  })
  useEffect(() => {
    const report = () => viewed.current.onViewed(viewed.current.previous)
    const element = root.current
    if (typeof IntersectionObserver === "undefined" || !element) {
      report()
      return
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect()
        report()
      }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <Card data-state="ready" data-testid="legendary-event-last-run" ref={root}>
      <CardHeader>
        <CardTitle>
          <h2>{t("history.title")}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4">
        <RunHistoryBody history={previous} isMobile={isMobile} since="last" />
        {earlier.length > 0 ? (
          <EarlierRuns
            histories={earlier}
            isMobile={isMobile}
            loadMore={loadMore}
            onEntryToggled={onEarlierEntryToggled}
            onExpanded={onEarlierExpanded}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}

function EarlierRuns({
  histories,
  isMobile,
  onExpanded,
  onEntryToggled,
  loadMore,
}: {
  histories: RunHistory[]
  isMobile: boolean
  onExpanded: (recordCount: number) => void
  onEntryToggled: LastRunSectionViewModel["onEarlierEntryToggled"]
  loadMore: LastRunSectionViewModel["loadMore"]
}) {
  const { t } = useTranslation("legendaryEvents")
  const [open, setOpen] = useState(false)
  const reported = useRef(false)
  const listId = useId()
  const toggle = () => {
    if (!open && !reported.current) {
      reported.current = true
      onExpanded(histories.length)
    }
    setOpen(!open)
  }
  return (
    <section
      className="flex min-w-0 flex-col gap-2 border-t pt-3"
      data-testid="legendary-event-earlier-runs"
    >
      <ToggleButton
        controls={listId}
        label={t("history.earlier.title", { runs: histories.length })}
        onToggle={toggle}
        open={open}
        testId="last-run-earlier-toggle"
      />
      {open ? (
        <ul className="flex min-w-0 flex-col gap-2" id={listId}>
          {histories.map((history) => (
            <EarlierRunEntry
              history={history}
              isMobile={isMobile}
              key={history.recordId}
              onToggled={(open) => onEntryToggled(history.recordId, open)}
            />
          ))}
          {loadMore ? (
            <li>
              <Button
                data-testid="last-run-load-more"
                disabled={loadMore.loading}
                onClick={loadMore.onLoadMore}
                size="sm"
                variant="outline"
              >
                {t("history.loadMore")}
              </Button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </section>
  )
}

function EarlierRunEntry({
  history,
  isMobile,
  onToggled,
}: {
  history: RunHistory
  isMobile: boolean
  onToggled: (open: boolean) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  const date = useRunDate(history.progressAt)
  return (
    <li
      className="flex min-w-0 flex-col gap-3 rounded-lg border p-2"
      data-record={history.recordId}
      data-testid="legendary-event-earlier-run"
    >
      <ToggleButton
        controls={bodyId}
        label={t("history.earlier.entry", {
          run: t("history.run", { run: history.run, total: RUN_COUNT }),
          date,
        })}
        onToggle={() => {
          onToggled(!open)
          setOpen(!open)
        }}
        open={open}
        testId="last-run-earlier-entry-toggle"
      />
      {open ? (
        <div id={bodyId}>
          <RunHistoryBody history={history} isMobile={isMobile} since="then" />
        </div>
      ) : null}
    </li>
  )
}
