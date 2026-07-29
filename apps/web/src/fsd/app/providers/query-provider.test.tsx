import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useQueryClient } from "@tanstack/react-query"

import { QueryProvider } from "./query-provider"

function Consumer() {
  const client = useQueryClient()
  return <span>{client ? "query client ready" : "missing"}</span>
}

describe("QueryProvider", () => {
  it("provides an in-memory query client", () => {
    render(
      <QueryProvider>
        <Consumer />
      </QueryProvider>
    )

    expect(screen.getByText("query client ready")).toBeInTheDocument()
  })
})
