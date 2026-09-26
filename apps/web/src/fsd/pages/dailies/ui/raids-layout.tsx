import {
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router"
import { useTranslation } from "react-i18next"

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
      {/* Today and Raids Plan show the account-wide plan (global goal order), so there is no project
          selector here: a project is a filter, never an execution scope. */}
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
      </div>
      <Outlet context={context} />
    </section>
  )
}
