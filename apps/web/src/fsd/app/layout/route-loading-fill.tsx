import { useTranslation } from "react-i18next"
import { useLocation } from "react-router"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"

import { PageContainer } from "@/widgets/page-container"

// An event page (`/legendary-events/:eventId` and its tabs), not the hub's static children.
const LEGENDARY_EVENT_PAGE =
  /^\/legendary-events\/(?!master-table\/?$|tier-list\/?$)[^/]+(?:\/(?:overview|teams|plan|run))?\/?$/
const PLAN_LIST_PAGES = new Set(["/plan/goals", "/plan/projects"])

/**
 * The shell's fallback while a lazy page chunk loads. Home, where every launch of the installed app
 * lands, an event page and Plan's Goals and Projects get a skeleton shaped like their own loading
 * state, so the page fills in where the skeleton stood; other pages keep the centred spinner
 * (spec: app-startup-rendering).
 */
export function RouteLoadingFill() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  if (pathname === "/home") {
    return <HomeSkeleton label={t("common.loading")} />
  }
  if (LEGENDARY_EVENT_PAGE.test(pathname)) {
    return <LegendaryEventSkeleton label={t("common.loading")} />
  }
  if (PLAN_LIST_PAGES.has(pathname)) {
    return <PlanListSkeleton label={t("common.loading")} />
  }

  return (
    <div
      aria-label={t("common.loading")}
      className="flex flex-1 items-center justify-center"
      role="status"
    >
      <Spinner aria-hidden="true" className="size-8 text-primary" />
    </div>
  )
}

function SkeletonCard({
  rows,
  rowClassName,
}: {
  rows: number
  rowClassName: string
}) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton className={rowClassName} key={index} />
        ))}
      </CardContent>
    </Card>
  )
}

/** Mirrors pages/home's HomePage: Right now, then Raids / Upcoming / Projects (stacked; from lg side
 *  by side as Raids, Projects, Upcoming), then the calendar. */
function HomeSkeleton({ label }: { label: string }) {
  return (
    <PageContainer aria-label={label} data-testid="home-skeleton" role="status">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:order-1">
          <SkeletonCard rowClassName="h-12 w-full rounded-lg" rows={3} />
        </div>
        <div className="min-w-0 lg:order-3">
          <SkeletonCard rowClassName="h-12 w-full rounded-lg" rows={3} />
        </div>
        <div className="min-w-0 lg:order-2">
          <SkeletonCard rowClassName="h-12 w-full rounded-lg" rows={2} />
        </div>
      </div>
      <SkeletonCard rowClassName="h-40 w-full rounded-lg" rows={1} />
    </PageContainer>
  )
}

/** Mirrors the event page's own loading state (pages/legendary-events' LegendaryEventPage) in the
 *  section's full-width container, so the page's own skeleton replaces this one in place. */
function LegendaryEventSkeleton({ label }: { label: string }) {
  return (
    <PageContainer
      aria-label={label}
      className="max-w-none"
      data-testid="legendary-event-skeleton"
      role="status"
    >
      <div className="flex flex-col gap-3">
        <Skeleton className="h-12 w-1/2 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </PageContainer>
  )
}

/** Plan's Goals and Projects: a toolbar row over two list rows, like their own loading states. */
function PlanListSkeleton({ label }: { label: string }) {
  return (
    <PageContainer aria-label={label} data-testid="plan-skeleton" role="status">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-full rounded-lg sm:w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </PageContainer>
  )
}
