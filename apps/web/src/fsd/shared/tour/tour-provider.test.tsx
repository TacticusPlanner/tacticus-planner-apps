import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { TourProvider, useTour } from "./tour-provider"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock("react-joyride", () => ({
  STATUS: { FINISHED: "finished", SKIPPED: "skipped" },
  useJoyride: () => ({ Tour: null }),
}))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({ useIsMobile: () => false }))
vi.mock("../theme/theme-provider", () => ({
  useTheme: () => ({ theme: "light" }),
}))
vi.mock("./general.tutorial", () => ({
  useDesktopTutorialSteps: () => [],
  useMobileTutorialSteps: () => [],
}))

function IsRunningProbe() {
  const { isRunning } = useTour()
  return <span data-testid="is-running">{String(isRunning)}</span>
}

const AUTO_STARTED_STORAGE_KEY = "tp.tour.autoStarted"

describe("TourProvider", () => {
  it("auto-starts the tour the first time this device opens the app", () => {
    window.localStorage.removeItem(AUTO_STARTED_STORAGE_KEY)

    render(
      <TourProvider>
        <IsRunningProbe />
      </TourProvider>
    )

    expect(screen.getByTestId("is-running")).toHaveTextContent("true")
    expect(window.localStorage.getItem(AUTO_STARTED_STORAGE_KEY)).toBe("1")
  })

  it("does not auto-start again on a device that has already seen it", () => {
    window.localStorage.setItem(AUTO_STARTED_STORAGE_KEY, "1")

    render(
      <TourProvider>
        <IsRunningProbe />
      </TourProvider>
    )

    expect(screen.getByTestId("is-running")).toHaveTextContent("false")
  })
})
