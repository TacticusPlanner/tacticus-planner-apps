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
      {/* dailies-navigation spec: the Today/Raids Plan sub-tabs and the project selector share one
          row (tabs leading, selector trailing) instead of two stacked rows; the selector compresses
          to icon-only on mobile via ProjectSelect's own compact mode. */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
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
