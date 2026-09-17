import { useAutoStartTourOnce } from "@/shared/tour"

import { useHomePageTutorial } from "./home-page.tutorial"
import { EventsCalendar } from "./events-calendar/events-calendar"
import { ProjectsWidget } from "./projects/projects-widget"
import { RaidsWidget } from "./raids/raids-widget"
import { TokenAvailability } from "./token-availability/token-availability"

export function HomePage() {
  useHomePageTutorial()
  // First visit on this device runs the navigation tour once. Lives here, not in TourProvider:
  // this route is behind ProtectedRoute, so it can't fire on the landing page or for a
  // signed-out visitor.
  useAutoStartTourOnce()

  return (
    <div className="flex flex-col gap-6" data-testid="home-page">
      <TokenAvailability />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ProjectsWidget />
        <RaidsWidget />
      </div>
      <EventsCalendar />
    </div>
  )
}
