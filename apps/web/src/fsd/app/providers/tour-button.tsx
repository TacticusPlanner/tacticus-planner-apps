import { Compass } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"

import { useTour } from "./tour-provider"

export function TourButton() {
  const { t } = useTranslation()
  const { isRunning, startTour } = useTour()

  return (
    <Button
      aria-label={t("tour.start")}
      data-testid="tour-button"
      disabled={isRunning}
      onClick={startTour}
      size="sm"
      variant="outline"
    >
      <Compass data-icon="inline-start" />
      {t("tour.start")}
    </Button>
  )
}
