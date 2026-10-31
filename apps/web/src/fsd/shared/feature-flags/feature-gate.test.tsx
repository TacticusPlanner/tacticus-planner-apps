import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/shared/config", () => ({
  getRequiredEnvironmentValue: () => "https://api.example/",
}))

import { render, screen } from "@/test/render"

import type { FeatureFlag } from "./feature-flags"
import { FeatureGate } from "./feature-gate"

// A name outside the union: the gate only compares names.
const preview = "Preview" as FeatureFlag

const respondWith = (enabled: string[]) =>
  vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json({ enabled }, { status: 200 }))

function renderGate() {
  return render(
    <FeatureGate flag={preview} fallback={<p>Coming soon</p>}>
      <p>Preview feature</p>
    </FeatureGate>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("FeatureGate", () => {
  it("shows the feature once the API lists its flag", async () => {
    const fetchMock = respondWith(["Other", "Preview"])

    renderGate()

    expect(screen.getByText("Coming soon")).toBeInTheDocument()
    expect(await screen.findByText("Preview feature")).toBeInTheDocument()
    // Anonymous: a plain URL and no Authorization header.
    const [url, init] = fetchMock.mock.lastCall ?? []
    expect(url).toEqual(new URL("https://api.example/api/v1/feature-flags"))
    expect(init?.headers).toBeUndefined()
  })

  it("keeps the feature hidden while its flag is off", async () => {
    respondWith(["Other"])

    renderGate()

    await vi.waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
    expect(screen.getByText("Coming soon")).toBeInTheDocument()
    expect(screen.queryByText("Preview feature")).not.toBeInTheDocument()
  })

  it("renders the last flags this browser saw while the request fails", async () => {
    window.localStorage.setItem("tp.featureFlags", JSON.stringify(["Preview"]))
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"))

    renderGate()

    expect(screen.getByText("Preview feature")).toBeInTheDocument()
    await vi.waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
    expect(screen.getByText("Preview feature")).toBeInTheDocument()
  })

  it("remembers the flags for the next visit", async () => {
    respondWith(["Preview"])

    renderGate()

    await screen.findByText("Preview feature")
    expect(window.localStorage.getItem("tp.featureFlags")).toBe('["Preview"]')
  })
})
