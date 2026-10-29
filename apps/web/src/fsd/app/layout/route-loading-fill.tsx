import { useTranslation } from "react-i18next"
import { useLocation } from "react-router"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"

import { PageContainer } from "@/widgets/page-container"

/**
 * The shell's fallback while a lazy page chunk loads. Home, where every launch of the installed app
 * lands, gets a skeleton of its own layout so its cards fill in where they will stay; other pages
 * keep the centred spinner (spec: app-startup).
 */
export function RouteLoadingFill() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  if (pathname === "/home") {
    return <HomeSkeleton label={t("common.loading")} />
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

/** Mirrors pages/home's HomePage: Right now, then Raids / Projects / Upcoming (side by side from lg,
 *  in that order), then the calendar. */
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
        <SkeletonCard rowClassName="h-12 w-full rounded-lg" rows={3} />
        <SkeletonCard rowClassName="h-12 w-full rounded-lg" rows={2} />
        <SkeletonCard rowClassName="h-12 w-full rounded-lg" rows={3} />
      </div>
      <SkeletonCard rowClassName="h-40 w-full rounded-lg" rows={1} />
    </PageContainer>
  )
}
