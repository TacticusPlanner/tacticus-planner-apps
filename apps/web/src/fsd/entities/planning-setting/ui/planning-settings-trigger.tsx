import { useTranslation } from "react-i18next"
import { Settings } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

/**
 * The one Planning Settings trigger, reused from Plan > Goals, Plan > Schedule and Dailies > Raids
 * (Today) — see `PlanningSettingsDialog` alongside it. Icon plus label on desktop, icon-only
 * with an accessible name below the 768px breakpoint (`expose-planning-settings-from-dailies`).
 * Callers own the dialog's open state and pass it their own toggle.
 */
export function PlanningSettingsTrigger({
  onClick,
  testId,
}: {
  onClick: () => void
  testId?: string
}) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  return (
    <Button
      aria-label={t("goals.planningSettings.button")}
      data-testid={testId}
      onClick={onClick}
      size="sm"
      variant="outline"
    >
      <Settings data-icon="inline-start" />
      {isMobile ? null : t("goals.planningSettings.button")}
    </Button>
  )
}
