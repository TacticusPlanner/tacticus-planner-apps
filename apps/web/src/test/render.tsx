import type { JSXElementConstructor, ReactElement, ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  render as testingLibraryRender,
  type RenderOptions,
} from "@testing-library/react"

// Test utilities intentionally re-export non-component Testing Library helpers.
// eslint-disable-next-line react-refresh/only-export-components
export * from "@testing-library/react"

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: {
        gcTime: Infinity,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  })
}

type TestWrapper = JSXElementConstructor<{ children: ReactNode }>

function createWrapper(UserWrapper?: TestWrapper): TestWrapper {
  const queryClient = createTestQueryClient()

  return function TestQueryWrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        {UserWrapper ? <UserWrapper>{children}</UserWrapper> : children}
      </QueryClientProvider>
    )
  }
}

export function render(
  ui: ReactElement,
  options: RenderOptions = {}
): ReturnType<typeof testingLibraryRender> {
  return testingLibraryRender(ui, {
    ...options,
    wrapper: createWrapper(options.wrapper),
  })
}
