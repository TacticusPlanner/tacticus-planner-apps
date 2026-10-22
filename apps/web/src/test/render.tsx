// Test utilities intentionally re-export non-component Testing Library helpers.
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  type JSXElementConstructor,
  type ReactElement,
  type ReactNode,
} from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  render as testingLibraryRender,
  type RenderOptions,
} from "@testing-library/react"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { createMemoryRouter, RouterProvider } from "react-router"

import { ThemeProvider } from "@/shared/theme"

import { setTestAuth } from "./auth"

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

export type TestRenderOptions = RenderOptions & {
  /** Mounts the UI as this route's element in a memory data router (e.g. `/plan/goals/:goalId`). */
  route?: string
  /** Router history; defaults to `[route]`. */
  initialEntries?: string[]
  /** Wraps the UI in the app's real `ThemeProvider`. */
  theme?: boolean
  /** Signed-in state for the MSAL test stub, applied before rendering. */
  auth?: Parameters<typeof setTestAuth>[0]
}

// Lets the router's single route element follow `rerender` without recreating the router.
const RouteChildren = createContext<ReactNode>(null)

function RouteElement() {
  return useContext(RouteChildren)
}

function createTestRouter(route: string, initialEntries = [route]) {
  return createMemoryRouter([{ path: route, element: <RouteElement /> }], {
    initialEntries,
  })
}

function createWrapper(
  UserWrapper: TestWrapper | undefined,
  { route, initialEntries, theme }: TestRenderOptions
): TestWrapper {
  const queryClient = createTestQueryClient()

  return function TestQueryWrapper({ children }) {
    const [router] = useState(() =>
      route ? createTestRouter(route, initialEntries) : null
    )
    let content = UserWrapper ? <UserWrapper>{children}</UserWrapper> : children

    if (router) {
      content = (
        <RouteChildren.Provider value={content}>
          <RouterProvider router={router} />
        </RouteChildren.Provider>
      )
    }

    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {theme ? <ThemeProvider>{content}</ThemeProvider> : content}
        </TooltipProvider>
      </QueryClientProvider>
    )
  }
}

export function render(
  ui: ReactElement,
  options: TestRenderOptions = {}
): ReturnType<typeof testingLibraryRender> {
  const { route, initialEntries, theme, auth, wrapper, ...rest } = options

  if (auth) {
    setTestAuth(auth)
  }

  return testingLibraryRender(ui, {
    ...rest,
    wrapper: createWrapper(wrapper, { route, initialEntries, theme }),
  })
}
