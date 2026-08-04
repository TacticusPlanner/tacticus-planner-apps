import { useState } from "react"
import { Outlet } from "react-router"
import { useTranslation } from "react-i18next"
import { Settings } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

import { PageContainer } from "@/widgets/page-container"

import { PlanningSettingsDialog } from "../settings/planning-settings-dialog"

/**
 * Parent route for the Goals area: the Goals list/grid, Projects, and Insights tabs are now
 * rendered by the shared app-shell header's section-tabs row (see `section-tabs.tsx`) instead of
 * here - this layout keeps only the Planning Settings entry point and the `<Outlet/>` for the
 * active tab's page.
 */
export function GoalsLayout() {
  return <GoalsLayoutContent />
}

function GoalsLayoutContent() {
  const { t } = useTranslation()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <PageContainer>
      <div className="flex justify-end">
        <Button
          data-testid="goals-planning-settings"
          variant="outline"
          size="sm"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings data-icon="inline-start" />
          {t("goals.planningSettings.button")}
        </Button>
      </div>
      <Outlet />
      {settingsOpen ? (
        <PlanningSettingsDialog open onOpenChange={setSettingsOpen} />
      ) : null}
    </PageContainer>
  )
}
