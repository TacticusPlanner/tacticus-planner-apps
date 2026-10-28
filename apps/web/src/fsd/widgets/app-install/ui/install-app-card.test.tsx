import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import {
  listenForInstallPrompt,
  resetInstallPromptForTests,
} from "../model/install-prompt-store"
import { InstallAppCard } from "./install-app-card"

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
const WINDOWS_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

function useUserAgent(userAgent: string) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent)
}

function firePrompt() {
  const event = Object.assign(
    new Event("beforeinstallprompt", { cancelable: true }),
    {
      prompt: vi.fn(() => Promise.resolve()),
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    }
  )
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

describe("InstallAppCard", () => {
  afterEach(() => {
    resetInstallPromptForTests()
    vi.restoreAllMocks()
  })

  it("walks an iPhone through Add to Home Screen and lists the shortcuts", async () => {
    useUserAgent(IPHONE)
    render(<InstallAppCard />)

    await userEvent.click(
      screen.getByRole("button", { name: "appInstall.card.howTo" })
    )

    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("appInstall.steps.ios.share")).toBeVisible()
    expect(within(dialog).getByText("appInstall.steps.ios.add")).toBeVisible()
    expect(
      within(dialog).getByText("appInstall.shortcuts.dailyRaids")
    ).toBeVisible()
    expect(within(dialog).getByText("appInstall.shortcuts.goals")).toBeVisible()
    expect(
      within(dialog).getByText("appInstall.shortcuts.legendaryEvents")
    ).toBeVisible()
  })

  it("installs in one tap where the browser offers its prompt", async () => {
    useUserAgent(WINDOWS_CHROME)
    listenForInstallPrompt()
    render(<InstallAppCard />)
    expect(screen.queryByTestId("app-install-card")).not.toBeInTheDocument()

    const event = firePrompt()
    await userEvent.click(
      screen.getByRole("button", { name: "appInstall.install" })
    )

    expect(event.prompt).toHaveBeenCalledOnce()
  })

  it("turns into the shortcuts tip once the app is installed", () => {
    useUserAgent(WINDOWS_CHROME)
    listenForInstallPrompt()
    render(<InstallAppCard />)
    firePrompt()

    act(() => {
      window.dispatchEvent(new Event("appinstalled"))
    })

    expect(screen.getByText("appInstall.card.installedBody")).toBeVisible()
  })

  it("stays away after Not now", async () => {
    useUserAgent(IPHONE)
    const { unmount } = render(<InstallAppCard />)

    await userEvent.click(
      screen.getByRole("button", { name: "appInstall.card.notNow" })
    )
    expect(screen.queryByTestId("app-install-card")).not.toBeInTheDocument()

    unmount()
    render(<InstallAppCard />)
    expect(screen.queryByTestId("app-install-card")).not.toBeInTheDocument()
  })
})
