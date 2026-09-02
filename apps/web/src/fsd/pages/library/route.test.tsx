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
    ])
  })
})
