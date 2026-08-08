import { Compass } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { useTour } from "@/shared/tour"

import { useHomePageTutorial } from "./home-page.tutorial"
import { EventsCalendar } from "./events-calendar/events-calendar"

export function HomePage() {
  const { t } = useTranslation(["events", "common"])
  const { isRunning, startTour } = useTour()

  useHomePageTutorial()

  return (
    <div className="flex flex-col gap-6" data-testid="home-page">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold" data-testid="home-page-title">
          {t("title")}
        </h1>
        <Button
          data-testid="home-page-tour-button"
          disabled={isRunning}
          onClick={startTour}
          variant="outline"
        >
          <Compass data-icon="inline-start" />
          {t("common:home.tourButton")}
        </Button>
      </div>
      <EventsCalendar />
    </div>
  )
}
