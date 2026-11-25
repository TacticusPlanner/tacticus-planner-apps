import { Link, useOutletContext } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import type { ShopRecommendationsViewModel } from "@/features/shops/recommendations"
import type { DailiesOutletContext } from "./dailies-layout"
import { ShopList } from "./shops/shop-list"
import { ShopsState } from "./shops/shops-state"
import { TODAY_SHOPS_ID } from "./today-shop-recommendations"
import { TodayCard } from "./today/today-card"

/**
 * Today's shop buys, a card in the Raids dashboard (the separate Shops tab was folded in here). It
 * reads the same Dailies-wide project as the raids, so the Raids project selector narrows both. The
 * card sits in a ~400-575px column, so it uses the compact shop layout at every width. Its header
 * links to Library > Shops, where every shop's schedule is.
 */
export function TodayShops({
  recommendations,
}: {
  recommendations: ShopRecommendationsViewModel
}) {
  const context = useOutletContext<DailiesOutletContext>()
  const { t } = useTranslation("shops")

  const project = context.projects.find(
    (candidate) => candidate.projectId === context.projectId
  )

  let body: React.ReactNode
  // The projects list only matters once a project narrows the offers; the all-goals scope reads the
  // global plan and needs none of it.
  if (context.projectId && context.projectsError) {
    body = <ShopsState state="error" onRetry={context.retryProjects} />
  } else if (context.projectId && context.projectsUnavailable) {
    body = <ShopsState state="no-project" />
  } else if (recommendations.status === "no-goals") {
    body = <ShopsState state="no-goals" />
  } else if (recommendations.status === "error") {
    body = <ShopsState state="error" onRetry={recommendations.retry} />
  } else if (recommendations.status === "loading") {
    body = <ShopsState state="loading" />
  } else {
    const hasAny = recommendations.sections.some(
      (section) => section.guaranteed.length + section.possible.length > 0
    )
    body = hasAny ? (
      <ShopList sections={recommendations.sections} />
    ) : (
      <ShopsState compact state="nothing" />
    )
  }

  return (
    <TodayCard
      action={
        <Button asChild size="sm" variant="ghost">
          <Link to="/library/shops">{t("schedulesLink")}</Link>
        </Button>
      }
      className="scroll-mt-[calc(var(--mobile-header-height)+1rem)] md:scroll-mt-4"
      id={TODAY_SHOPS_ID}
      testId="today-shops"
      title={t("title")}
    >
      <p className="-mt-2 text-sm text-muted-foreground">
        {project ? t("subtitle", { project: project.name }) : t("subtitleAll")}
      </p>
      {body}
    </TodayCard>
  )
}
