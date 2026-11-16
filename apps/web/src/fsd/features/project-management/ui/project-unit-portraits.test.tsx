import { describe, expect, it } from "vitest"

import { render, screen } from "@/test/render"

import { ProjectUnitPortraits } from "./project-unit-portraits"

const unit = (entityId: string) => ({ entityType: "Character", entityId })

describe("ProjectUnitPortraits", () => {
  it("shows the given portraits, then +N for the units past them", () => {
    render(
      <ProjectUnitPortraits
        total={6}
        units={["kharn", "abaddon", "typhus", "lucius"].map(unit)}
      />
    )

    const group = screen.getByRole("img", {
      name: "kharn, abaddon, typhus, lucius and 2 more",
    })
    expect(group.querySelectorAll("img")).toHaveLength(4)
    expect(group).toHaveTextContent("+2")
  })

  it("shows no +N when every unit is shown", () => {
    render(<ProjectUnitPortraits total={2} units={["a", "b"].map(unit)} />)

    expect(screen.getByTestId("project-unit-portraits")).not.toHaveTextContent(
      "+"
    )
  })

  it("renders nothing without units", () => {
    render(<ProjectUnitPortraits total={0} units={[]} />)

    expect(screen.queryByTestId("project-unit-portraits")).toBeNull()
  })
})
