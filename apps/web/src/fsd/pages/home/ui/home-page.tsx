import { InstallAppCard } from "@/widgets/app-install"
import { PageContainer } from "@/widgets/page-container"
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

  // Mobile stacks in source order (Right now, Daily Raids, Upcoming, Projects, Calendar); from lg the
  // middle row puts Raids, Projects and Upcoming side by side, in that order.
  return (
    <PageContainer data-testid="home-page">
      <InstallAppCard />
      <RightNow events={events} />
      <div
        className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3"
        data-testid="home-widgets-row"
      >
        <div className="min-w-0 lg:order-1">
          <RaidsWidget />
        </div>
        <div className="min-w-0 lg:order-3">
          <UpcomingEvents events={events} />
        </div>
        <div className="min-w-0 lg:order-2">
          <ProjectsWidget />
        </div>
      </div>
      <EventsCalendar />
    </PageContainer>
  )
}
