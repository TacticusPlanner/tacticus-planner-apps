import { Compass } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { useTour } from "./tour-provider"

export function TourButton({
  className,
  onStarted,
}: {
  className?: string
  onStarted?: () => void
}) {
  const { t } = useTranslation()
  const { isRunning, startTour } = useTour()

  return (
    <Button
      aria-label={t("tour.start")}
      className={cn(className)}
      data-testid="tour-button"
      disabled={isRunning}
      onClick={() => {
        startTour()
        onStarted?.()
      }}
      size="sm"
      variant="outline"
    >
      <Compass data-icon="inline-start" />
      {t("tour.start")}
    </Button>
  )
}
