import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const joyrideState = vi.hoisted(() => ({
  run: false,
  steps: [] as Array<{ content?: unknown; target?: unknown; title?: unknown }>,
}))
const mobileState = vi.hoisted(() => ({ value: false }))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("react-joyride", () => ({
  STATUS: { FINISHED: "finished", SKIPPED: "skipped" },
  useJoyride: (options: {
    run: boolean
    steps: Array<{ content?: unknown; target?: unknown; title?: unknown }>
  }) => {
    joyrideState.run = options.run
    joyrideState.steps = options.steps

    return { Tour: <div data-testid="joyride" /> }
  },
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mobileState.value,
}))

vi.mock("../theme/theme-provider", () => ({
  useTheme: () => ({ theme: "system" }),
}))

import { TourProvider, usePageTour, useTour } from "./tour-provider"

function RegisteredPageTour() {
  usePageTour(({ platform, t }) => [
    {
      content: t("page.content"),
      target: "body",
      title: `page-${platform}`,
    },
  ])

  return null
}

function StartTourButton() {
  const { isRunning, startTour } = useTour()

  return (
    <button type="button" onClick={startTour}>
      {isRunning ? "running" : "start"}
    </button>
  )
}

describe("TourProvider", () => {
  beforeEach(() => {
    joyrideState.run = false
    joyrideState.steps = []
    mobileState.value = false
  })

  it("uses the general layout tutorial when no page registers its own steps", () => {
    render(
      <TourProvider>
        <StartTourButton />
      </TourProvider>
    )

    expect(joyrideState.steps[0]).toMatchObject({
      target: "body",
      title: "tour.steps.welcome.title",
    })
  })

  it("uses page-specific desktop tutorial steps when registered", async () => {
    render(
      <TourProvider>
        <RegisteredPageTour />
        <StartTourButton />
      </TourProvider>
    )

    await waitFor(() => {
      expect(joyrideState.steps[0]).toMatchObject({
        content: "page.content",
        target: "body",
        title: "page-desktop",
      })
    })
  })

  it("passes the mobile platform into registered tutorial steps", async () => {
    mobileState.value = true

    render(
      <TourProvider>
        <RegisteredPageTour />
        <StartTourButton />
      </TourProvider>
    )

    await waitFor(() => {
      expect(joyrideState.steps[0]).toMatchObject({ title: "page-mobile" })
    })
  })

  it("starts the active tutorial from the shared entry point", async () => {
    const user = userEvent.setup()
    render(
      <TourProvider>
        <RegisteredPageTour />
        <StartTourButton />
      </TourProvider>
    )

    await user.click(screen.getByRole("button", { name: "start" }))

    expect(joyrideState.run).toBe(true)
    expect(screen.getByRole("button", { name: "running" })).toBeInTheDocument()
  })
})
