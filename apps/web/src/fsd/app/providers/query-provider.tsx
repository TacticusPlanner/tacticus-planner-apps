import { useEffect, useRef, type ReactNode } from "react"
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query"

import { authenticatedQueryKey } from "@/shared/api"
import { useActiveAccountId } from "@/shared/auth"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 0,
    },
  },
})

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AccountQueryCacheBoundary>{children}</AccountQueryCacheBoundary>
    </QueryClientProvider>
  )
}

function AccountQueryCacheBoundary({ children }: { children: ReactNode }) {
  const accountId = useActiveAccountId()
  const client = useQueryClient()
  const previousAccountId = useRef(accountId)

  useEffect(() => {
    const previous = previousAccountId.current
    previousAccountId.current = accountId

    if (!previous || previous === accountId) {
      return
    }

    void client
      .cancelQueries({ queryKey: authenticatedQueryKey(previous) })
      .then(() => {
        client.removeQueries({ queryKey: authenticatedQueryKey(previous) })
      })
  }, [accountId, client])

  return children
}
