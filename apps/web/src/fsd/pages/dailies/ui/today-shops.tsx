import { useOutletContext } from "react-router"
import { useTranslation } from "react-i18next"

import { useShopRecommendations } from "@/features/shop-recommendations"
import type { DailiesOutletContext } from "./dailies-layout"
import { ShopsMobile } from "./shops/mobile/shops-mobile"
import { ShopsState } from "./shops/shops-state"
import { TodayCard } from "./today/today-card"

/**
 * Today's shop buys, a card in the Raids dashboard (the separate Shops tab was folded in here). It
 * reads the same Dailies-wide project as the raids, so the Raids project selector narrows both. The
 * card sits in a ~400-575px column, so it uses the compact shop layout at every width.
 */
export function TodayShops() {
  const context = useOutletContext<DailiesOutletContext>()
  const { t } = useTranslation("shops")
  const recommendations = useShopRecommendations(context.projectId)

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
      <ShopsMobile sections={recommendations.sections} />
    ) : (
      <ShopsState compact state="nothing" />
    )
  }

  return (
    <TodayCard testId="today-shops" title={t("title")}>
      <p className="-mt-2 text-xs text-muted-foreground">
        {project ? t("subtitle", { project: project.name }) : t("subtitleAll")}
      </p>
      {body}
    </TodayCard>
  )
}
