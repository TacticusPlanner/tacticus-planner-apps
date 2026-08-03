import {
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router"
import { useTranslation } from "react-i18next"

import { ProjectSelect } from "@/entities/project"

import type { DailiesOutletContext } from "./dailies-layout"
import { RouteTabs } from "./dailies-layout"

export function RaidsLayout() {
  const context = useOutletContext<DailiesOutletContext>()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation("dailies")
  const active = pathname.endsWith("/plan") ? "plan" : "today"

  return (
    <section className="space-y-5" data-testid="dailies-raids-layout">
      <RouteTabs
        active={active}
        navigate={navigate}
        testId="raids-tabs"
        tabs={[
          {
            value: "today",
            label: t("raids.tabs.today"),
            path: "/dailies/raids/today",
          },
          {
            value: "plan",
            label: t("raids.tabs.plan"),
            path: "/dailies/raids/plan",
          },
        ]}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("raids.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("raids.description")}
          </p>
        </div>
        <ProjectSelect
          projects={context.projects}
          projectId={context.projectId}
          onProjectIdChange={context.setProjectId}
          placeholder={t("project.placeholder")}
          testId="dailies-project-select"
        />
      </div>
      <Outlet context={context} />
    </section>
  )
}
