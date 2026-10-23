import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe("gameAssetUrl", () => {
  it("returns the plain catalog URL when no asset version is set", async () => {
    vi.stubEnv("VITE_GAME_ASSETS_VERSION", "")
    const { gameAssetUrl } = await import("./asset-path")

    expect(gameAssetUrl("stars/gold.webp")).toBe(
      "/game_catalog/stars/gold.webp"
    )
  })

  it("stamps the asset version a build sets, so a changed image gets a new URL", async () => {
    vi.stubEnv("VITE_GAME_ASSETS_VERSION", "01336a1ea86a")
    const { gameAssetUrl } = await import("./asset-path")

    expect(gameAssetUrl("stars/gold.webp")).toBe(
      "/game_catalog/stars/gold.webp?v=01336a1ea86a"
    )
  })
})
