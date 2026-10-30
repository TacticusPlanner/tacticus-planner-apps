import { afterEach, describe, expect, it, vi } from "vitest"

import {
  getInstallPromptState,
  listenForInstallPrompt,
  promptInstall,
  resetInstallPromptForTests,
  subscribeInstallPrompt,
} from "./install-prompt-store"

function firePrompt(outcome: "accepted" | "dismissed") {
  const event = Object.assign(
    new Event("beforeinstallprompt", { cancelable: true }),
    {
      prompt: vi.fn(() => Promise.resolve()),
      userChoice: Promise.resolve({ outcome }),
    }
  )
  window.dispatchEvent(event)
  return event
}

describe("install prompt store", () => {
  afterEach(() => {
    resetInstallPromptForTests()
  })

  it("holds the browser's prompt and keeps its mini-infobar away", () => {
    listenForInstallPrompt()
    const listener = vi.fn()
    subscribeInstallPrompt(listener)

    const event = firePrompt("accepted")

    expect(event.defaultPrevented).toBe(true)
    expect(getInstallPromptState().canPrompt).toBe(true)
    expect(listener).toHaveBeenCalled()
  })

  it("shows the held prompt once and reports the answer", async () => {
    listenForInstallPrompt()
    const event = firePrompt("dismissed")

    await expect(promptInstall()).resolves.toBe("dismissed")
    expect(event.prompt).toHaveBeenCalledOnce()
    expect(getInstallPromptState().canPrompt).toBe(false)
    await expect(promptInstall()).resolves.toBe("unavailable")
  })

  it("marks the app installed when the browser says so", () => {
    listenForInstallPrompt()
    firePrompt("accepted")

    window.dispatchEvent(new Event("appinstalled"))

    expect(getInstallPromptState()).toEqual({
      canPrompt: false,
      justInstalled: true,
    })
  })
})
