import { HelpCircle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { useTour } from "./tour-provider"

/**
 * Starts the *current page's* own tour, as opposed to the app-wide navigation tour behind the
 * persistent "Show me around" control in the sidebar/account menu. Renders nothing on a page that
 * hasn't registered page steps via `useTourPageSteps`, so it can be dropped into a shared page
 * header without each page opting in.
 */
export function PageTourButton({
  className,
  iconOnly = false,
}: {
  className?: string
  iconOnly?: boolean
}) {
  const { t } = useTranslation()
  const { hasPageTour, isRunning, startPageTour } = useTour()

  if (!hasPageTour) return null

  return (
    <Button
      aria-label={t("tour.startPage")}
      className={cn(iconOnly && "size-10 rounded-full", className)}
      data-testid="page-tour-button"
      disabled={isRunning}
      onClick={startPageTour}
      size={iconOnly ? "icon" : "sm"}
      variant="ghost"
    >
      <HelpCircle data-icon={iconOnly ? undefined : "inline-start"} />
      {iconOnly ? null : t("tour.startPage")}
    </Button>
  )
}
