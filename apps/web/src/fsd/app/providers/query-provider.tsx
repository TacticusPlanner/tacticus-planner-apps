import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { SERVER_DATA_STALE_TIME } from "@/shared/api"
import { registerLocalDataQueryClient } from "@/shared/local-data"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: SERVER_DATA_STALE_TIME,
    },
  },
})
registerLocalDataQueryClient(queryClient)

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
