import { Compass } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { useTour } from "./tour-provider"

export function TourButton({
  className,
  iconOnly = false,
  onStarted,
}: {
  className?: string
  iconOnly?: boolean
  onStarted?: () => void
}) {
  const { t } = useTranslation()
  const { isRunning, startTour } = useTour()

  return (
    <Button
      aria-label={t("tour.start")}
      className={cn(iconOnly && "size-10 rounded-full", className)}
      data-testid="tour-button"
      disabled={isRunning}
      onClick={() => {
        startTour()
        onStarted?.()
      }}
      size={iconOnly ? "icon" : "sm"}
      variant="outline"
    >
      <Compass data-icon="inline-start" />
      {iconOnly ? null : t("tour.start")}
    </Button>
  )
}
