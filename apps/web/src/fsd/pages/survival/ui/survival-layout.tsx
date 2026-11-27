import { useTranslation } from "react-i18next"
import {
  Navigate,
  Outlet,
  useMatch,
  useNavigate,
  useSearchParams,
} from "react-router"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Tabs } from "@workspace/ui/components/tabs"

import {
  EmptyState,
  LocalReadFailure,
  PageTabsList,
  PageTabsTrigger,
} from "@/shared/ui"
import { PageContainer } from "@/widgets/page-container"

import type { SurvivalContext } from "../model/survival-context"
import {
  defaultSurvivalEventId,
  survivalEventStatus,
} from "../model/survival-event-status"
import {
  SURVIVAL_TABS,
  isSurvivalTab,
  survivalTabHref,
} from "../model/survival-tabs"
import type { SurvivalTab } from "../model/survival-tabs"
import { useSurvivalEvents } from "../model/use-survival-events"
import { useSurvivalNow } from "../model/use-survival-now"
import { useSurvivalTabViewed } from "../model/use-survival-tab-viewed"
import { HowEventWorks, SurvivalEventLine } from "./survival-event-line"
import { SurvivalEventPicker } from "./survival-event-picker"
import { useSurvivalTutorial } from "./survival.tutorial"

/**
 * Plan › Survival (design: Survival V2 rebuild): the event switcher, the event line and "How this event
 * works" above the Team, Enemies, Rewards, Missions and Offers tabs, each its own route. The event is
 * `?event=` (kept across tabs); without it the page shows the running event, else the next one, else
 * the newest past one. An unknown event drops the parameter.
 */
export function SurvivalLayout() {
  const { t } = useTranslation("survival")
  const events = useSurvivalEvents()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const match = useMatch("/plan/survival/:tab")
  const list = events.status === "ready" ? events.data : undefined
  const now = useSurvivalNow(list)
  const tabParam = match?.params.tab
  const tab: SurvivalTab | null = isSurvivalTab(tabParam) ? tabParam : null

  const requested = params.get("event")
  const requestedEvent = list?.find((event) => event.id === requested)
  const selectedId = list
    ? (requestedEvent?.id ?? defaultSurvivalEventId(list, now))
    : null
  const event = list?.find((entry) => entry.id === selectedId)
  const status = event ? survivalEventStatus(event, now) : null
  // The event stays in the address only when it was asked for.
  const linkedId = requestedEvent ? requestedEvent.id : null
  useSurvivalTabViewed(tab, event?.id ?? null, status)
  useSurvivalTutorial(tab ?? "team")

  if (list && requested !== null && !requestedEvent) {
    return <Navigate replace to={survivalTabHref(tab ?? "team", null)} />
  }

  let content
  if (events.status === "loading") {
    content = (
      <div
        aria-label={t("page.loading")}
        className="flex flex-col gap-4"
        role="status"
      >
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-6 w-full max-w-xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  } else if (events.status === "error") {
    content = <LocalReadFailure retry={events.retry} />
  } else if (!event || !status || !list) {
    content = (
      <EmptyState
        description={t("page.noEventsDescription")}
        testId="survival-no-events"
        title={t("page.noEvents")}
      />
    )
  } else {
    const context: SurvivalContext = { event, status }
    content = (
      <>
        <div className="flex flex-col gap-3">
          <SurvivalEventPicker
            events={list}
            now={now}
            onSelect={(eventId) =>
              void navigate(survivalTabHref(tab ?? "team", eventId))
            }
            selectedId={event.id}
          />
          <SurvivalEventLine event={event} status={status} />
          <HowEventWorks event={event} />
        </div>
        <Tabs
          onValueChange={(value) => {
            if (isSurvivalTab(value)) {
              void navigate(survivalTabHref(value, linkedId))
            }
          }}
          value={tab ?? "team"}
        >
          <PageTabsList aria-label={t("tabs.label")}>
            {SURVIVAL_TABS.map((entry) => (
              <PageTabsTrigger
                data-testid={`survival-tab-${entry}`}
                key={entry}
                value={entry}
              >
                {t(`tabs.${entry}`)}
              </PageTabsTrigger>
            ))}
          </PageTabsList>
        </Tabs>
        <Outlet context={context} />
      </>
    )
  }

  return (
    <PageContainer data-testid="survival-page">
      <div className="flex flex-col gap-5">{content}</div>
    </PageContainer>
  )
}
