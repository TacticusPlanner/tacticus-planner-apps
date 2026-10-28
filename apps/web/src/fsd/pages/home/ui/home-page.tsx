import { useAutoStartTourOnce } from "@/shared/tour"

import { useHomeEvents } from "../model/use-home-events"
import { useHomePageTutorial } from "./home-page.tutorial"
import { EventsCalendar } from "./events-calendar/events-calendar"
import { UpcomingEvents } from "./events/upcoming-events"
import { ProjectsWidget } from "./projects/projects-widget"
import { RaidsWidget } from "./raids/raids-widget"
import { RightNow } from "./right-now/right-now"

export function HomePage() {
  useHomePageTutorial()
  // First visit on this device runs the navigation tour once. Lives here, not in TourProvider:
  // this route is behind ProtectedRoute, so it can't fire on the landing page or for a
  // signed-out visitor.
  useAutoStartTourOnce()
  // Read once: Right now shows the live events, Upcoming events what starts next.
  const events = useHomeEvents()

  // Mobile stacks in source order (Right now, Daily Raids, Upcoming, Projects, Calendar); desktop puts
  // Raids beside Upcoming, Raids taking the wider column.
  return (
    <div className="flex flex-col gap-6" data-testid="home-page">
      <RightNow events={events} />
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-5"
        data-testid="home-raids-row"
      >
        <div className="min-w-0 md:col-span-3">
          <RaidsWidget />
        </div>
        <div className="min-w-0 md:col-span-2">
          <UpcomingEvents events={events} />
        </div>
      </div>
      <ProjectsWidget />
      <EventsCalendar />
    </div>
  )
}
