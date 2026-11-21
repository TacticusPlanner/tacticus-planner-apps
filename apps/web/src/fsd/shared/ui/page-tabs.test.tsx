import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { Tabs, TabsContent } from "@workspace/ui/components/tabs"

import { render, screen } from "@/test/render"

import { PageTabsList, PageTabsTrigger } from "./page-tabs"

describe("PageTabs", () => {
  it("is a named underline tab strip in a sideways scroll box that switches views", async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue="a">
        <PageTabsList aria-label="Views" scrollTestId="views-scroll">
          <PageTabsTrigger value="a">Alpha</PageTabsTrigger>
          <PageTabsTrigger value="b">Beta</PageTabsTrigger>
        </PageTabsList>
        <TabsContent value="a">Alpha view</TabsContent>
        <TabsContent value="b">Beta view</TabsContent>
      </Tabs>
    )
    const list = screen.getByRole("tablist", { name: "Views" })
    expect(list).toHaveAttribute("data-variant", "line")
    expect(screen.getByTestId("views-scroll")).toHaveClass("overflow-x-auto")
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveClass("flex-none")
    expect(screen.getByText("Alpha view")).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Beta" }))
    expect(screen.getByRole("tab", { name: "Beta" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(screen.getByText("Beta view")).toBeInTheDocument()
  })
})
