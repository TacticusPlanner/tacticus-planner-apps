import { Compass } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { useTour } from "@/shared/tour"

// Placeholder landing spot for authenticated users while the real home page is designed — its only
// job today is to surface the guided tour, so first-time users can get oriented.
export function HomePage() {
  const { t } = useTranslation()
  const { isRunning, startTour } = useTour()

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center"
      data-testid="home-page"
    >
      <p className="text-muted-foreground">{t("home.subtitle")}</p>
      <Button disabled={isRunning} onClick={startTour} size="lg">
        <Compass data-icon="inline-start" />
        {t("home.tourButton")}
      </Button>
    </div>
  )
}
