import { useOutletContext } from "react-router"
import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { useShopRecommendations } from "@/features/shop-recommendations"
import type { DailiesOutletContext } from "./dailies-layout"
import { ShopsDesktop } from "./shops/desktop/shops-desktop"
import { ShopsMobile } from "./shops/mobile/shops-mobile"
import { ShopsState } from "./shops/shops-state"

/**
 * Today's shop buys, shown on Dailies > Raids under the raid lanes (the separate Shops tab was folded
 * in here). It reads the same Dailies-wide project as the raids above it, so the Raids project
 * selector narrows both.
 */
export function TodayShops() {
  const context = useOutletContext<DailiesOutletContext>()
  const { t } = useTranslation("shops")
  const isMobile = useIsMobile()
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
    body = !hasAny ? (
      <ShopsState state="nothing" />
    ) : isMobile ? (
      <ShopsMobile sections={recommendations.sections} />
    ) : (
      <ShopsDesktop sections={recommendations.sections} />
    )
  }

  return (
    <section className="space-y-3 md:space-y-4" data-testid="today-shops">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">
          {project
            ? t("subtitle", { project: project.name })
            : t("subtitleAll")}
        </p>
      </div>
      {body}
    </section>
  )
}
