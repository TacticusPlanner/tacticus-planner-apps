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

  it("renders nothing without chips, stacked or not", () => {
    const { container, rerender } = render(
      <TeamStatusChips items={[]} stacked />
    )
    expect(container).toBeEmptyDOMElement()
    rerender(<TeamStatusChips items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("adds no second line when stacked with one chip", () => {
    render(<TeamStatusChips items={[items[1]!]} stacked />)

    const status = screen.getByTestId("team-status")
    expect(status.children).toHaveLength(1)
    expect(texts(status)).toEqual(["2 under cap"])
  })

  it("leads with a warning when there is no error, a cap last", () => {
    render(<TeamStatusChips items={[items[0]!, items[1]!]} stacked />)

    const status = screen.getByTestId("team-status")
    expect(texts(status)).toEqual(["2 under cap", "Legendary cap"])
    const lines = [...status.children] as HTMLElement[]
    expect(lines).toHaveLength(2)
    expect(texts(lines[1]!)).toEqual(["Legendary cap"])
  })

  it("leads with a cap when it is the only kind", () => {
    const caps: TeamStatusItem[] = [
      items[0]!,
      { key: "cap2", kind: "cap", text: "Mythic cap" },
    ]
    render(<TeamStatusChips items={caps} stacked />)

    const status = screen.getByTestId("team-status")
    expect(texts(status)).toEqual(["Legendary cap", "Mythic cap"])
    const lines = [...status.children] as HTMLElement[]
    expect(texts(lines[1]!)).toEqual(["Mythic cap"])
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
