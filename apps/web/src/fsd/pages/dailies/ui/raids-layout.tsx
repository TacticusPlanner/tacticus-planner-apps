import { useState } from "react"
import {
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router"
import { useTranslation } from "react-i18next"

import { ProjectSelect } from "@/entities/project"
import {
  PlanningSettingsDialog,
  PlanningSettingsTrigger,
} from "@/entities/planning-setting"

import type { DailiesOutletContext } from "./dailies-layout"
import { RouteTabs } from "./dailies-layout"

/**
 * Shared layout for Today and Raids Plan. Trailing the tabs/project-selector row is the Planning
 * Settings trigger (`expose-planning-settings-from-dailies`) - the same shared dialog Plan > Goals
 * opens, reached here without leaving Dailies. Its open state is owned here (not by Today/Raids
 * Plan themselves) so it persists across sub-tab navigation.
 */
export function RaidsLayout() {
  const context = useOutletContext<DailiesOutletContext>()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation("dailies")
  const active = pathname.endsWith("/plan") ? "plan" : "today"
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <section className="space-y-5" data-testid="dailies-raids-layout">
      {/* Today and Raids Plan plan over every Active goal in global order; the project selector
          optionally narrows the run to one project (default: all goals). */}
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
        <div className="flex items-center gap-2">
          <ProjectSelect
            allowAll
            onProjectIdChange={context.setProjectId}
            placeholder={t("project.placeholder")}
            projectId={context.projectId}
            projects={context.projects}
            testId="raids-project-select"
          />
          <PlanningSettingsTrigger
            onClick={() => setSettingsOpen(true)}
            testId="raids-planning-settings"
          />
        </div>
      </div>
      <Outlet context={context} />
      {settingsOpen ? (
        <PlanningSettingsDialog
          onOpenChange={setSettingsOpen}
          open={settingsOpen}
        />
      ) : null}
    </section>
  )
}
