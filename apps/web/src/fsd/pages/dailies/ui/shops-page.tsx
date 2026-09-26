import { useOutletContext } from "react-router"
import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { ProjectSelect } from "@/entities/project"

import { useShopRecommendations } from "../model/use-shop-recommendations"
import type { DailiesOutletContext } from "./dailies-layout"
import { ShopsDesktop } from "./shops/desktop/shops-desktop"
import { ShopsMobile } from "./shops/mobile/shops-mobile"
import { ShopsState } from "./shops/shops-state"
import { useShopsTutorial } from "./shops-page.tutorial"

export function ShopsPage() {
  const context = useOutletContext<DailiesOutletContext>()
  const { t } = useTranslation(["shops", "dailies"])
  const isMobile = useIsMobile()
  const recommendations = useShopRecommendations(context.projectId)
  useShopsTutorial()

  const project = context.projects.find(
    (candidate) => candidate.projectId === context.projectId
  )

  let body: React.ReactNode
  if (context.projectsError) {
    body = <ShopsState state="error" onRetry={context.retryProjects} />
  } else if (context.projectsUnavailable) {
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
    <div className="space-y-5 md:space-y-7" data-testid="shops-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          {/* Offers are recommended for every Active goal unless a project narrows them; the
              account-wide raid plan (Today, Raids Plan) is not affected by it. */}
          <p className="text-sm text-muted-foreground">
            {project
              ? t("subtitle", { project: project.name })
              : t("subtitleAll")}
          </p>
        </div>
        <ProjectSelect
          allowAll
          compact={false}
          onProjectIdChange={context.setProjectId}
          placeholder={t("dailies:project.placeholder")}
          projectId={context.projectId}
          projects={context.projects}
          testId="shops-project-select"
        />
      </div>
      {body}
    </div>
  )
}
