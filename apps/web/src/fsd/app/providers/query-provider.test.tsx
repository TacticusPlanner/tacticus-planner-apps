import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useQueryClient } from "@tanstack/react-query"

import { QueryProvider } from "./query-provider"

function Consumer() {
  const client = useQueryClient()
  return <span>{client ? "query client ready" : "missing"}</span>
}

function Defaults() {
  const queries = useQueryClient().getDefaultOptions().queries
  return <pre>{JSON.stringify(queries)}</pre>
}

describe("QueryProvider", () => {
  it("serves server data from the cache for five minutes and never refetches on focus or reconnect", () => {
    render(
      <QueryProvider>
        <Defaults />
      </QueryProvider>
    )

    const queries = JSON.parse(screen.getByText(/staleTime/).textContent)
    expect(queries).toEqual({
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000,
    })
    expect(queries).not.toHaveProperty("refetchOnMount")
  })

  it("provides an in-memory query client", () => {
    render(
      <QueryProvider>
        <Consumer />
      </QueryProvider>
    )

    expect(screen.getByText("query client ready")).toBeInTheDocument()
  })
})
