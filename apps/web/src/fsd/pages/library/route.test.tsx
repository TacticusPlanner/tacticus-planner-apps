import { describe, expect, it } from "vitest"

import { routes } from "./route"

describe("Library routes", () => {
  it("exposes each plural collection and its optional entity path", () => {
    expect(routes.map((route) => route.path)).toEqual([
      undefined,
      "characters",
      "characters/:entityId",
      "machines-of-war",
      "machines-of-war/:entityId",
      "npcs",
      "npcs/:entityId",
      "raid-bosses",
      "raid-bosses/:entityId",
      "shops",
    ])
  })

  it("routes Shops as a standalone reference page with no entity path", () => {
    const shopPaths = routes
      .map((route) => route.path)
      .filter((path) => path?.startsWith("shops"))
    expect(shopPaths).toEqual(["shops"])
  })
})
