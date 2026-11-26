import { describe, expect, it } from "vitest"

import { render, screen } from "@/test/render"

import { TeamUnitPortrait } from "./team-unit-portrait"

describe("TeamUnitPortrait", () => {
  it("marks a Machine of War with the MoW badge where a character shows its rank", () => {
    render(
      <>
        <TeamUnitPortrait
          unit={{
            kind: "mow",
            unitId: "ultraDreadnought",
            owned: true,
            progression: "Epic:RedOneStar",
          }}
        />
        <TeamUnitPortrait
          unit={{
            kind: "character",
            unitId: "ultraCalgar",
            owned: true,
            progression: "Epic:RedOneStar",
            rank: "Gold1",
          }}
        />
      </>
    )
    expect(screen.getAllByTestId("team-unit-mow-badge")).toHaveLength(1)
  })

  it("shows the padlock, not the MoW badge, on a locked Machine of War", () => {
    render(
      <TeamUnitPortrait
        unit={{ kind: "mow", unitId: "ultraDreadnought", owned: false }}
      />
    )
    expect(screen.queryByTestId("team-unit-mow-badge")).toBeNull()
  })
})
