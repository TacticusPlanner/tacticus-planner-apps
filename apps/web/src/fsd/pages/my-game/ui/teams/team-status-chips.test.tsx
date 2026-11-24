import { describe, expect, it } from "vitest"

import { render, screen, within } from "@/test/render"
import { TeamStatusChips } from "./team-status-chips"
import type { TeamStatusItem } from "./use-team-status"

const items: TeamStatusItem[] = [
  { key: "cap", kind: "cap", text: "Legendary cap" },
  { key: "warn", kind: "warn", text: "2 under cap" },
  { key: "error", kind: "error", text: "Too many units" },
]

const texts = (element: HTMLElement) =>
  within(element)
    .getAllByTestId("team-status-chip")
    .map((chip) => chip.textContent)

describe("TeamStatusChips", () => {
  it("stacks the most serious chip alone on the first line, the rest side by side under it", () => {
    render(<TeamStatusChips items={items} stacked />)

    const status = screen.getByTestId("team-status")
    expect(texts(status)).toEqual([
      "Too many units",
      "2 under cap",
      "Legendary cap",
    ])
    const lines = [...status.children] as HTMLElement[]
    expect(lines).toHaveLength(2)
    expect(texts(lines[1]!)).toEqual(["2 under cap", "Legendary cap"])
  })

  it("keeps the given order in one wrapping row on a card", () => {
    render(<TeamStatusChips items={items} />)

    expect(texts(screen.getByTestId("team-status"))).toEqual([
      "Legendary cap",
      "2 under cap",
      "Too many units",
    ])
  })
})
