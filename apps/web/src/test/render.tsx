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
  renderHook as testingLibraryRenderHook,
  type RenderHookOptions,
  type RenderOptions,
} from "@testing-library/react"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import {
  createMemoryRouter,
  RouterProvider,
  type InitialEntry,
} from "react-router"

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
  initialEntries?: InitialEntry[]
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

function createTestRouter(
  route: string,
  initialEntries: InitialEntry[] = [route]
) {
  return createMemoryRouter([{ path: route, element: <RouteElement /> }], {
    initialEntries,
  })
}

function createWrapper(
  UserWrapper: TestWrapper | undefined,
  { route, initialEntries, theme }: TestRenderOptions,
  queryClient: QueryClient
): TestWrapper {
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

/** `render` with the test providers; the result also carries the test's `queryClient` (e.g. to
 *  refresh local reads after seeding a "sync" with `refreshLocalDataAfterSync`). */
export function render(
  ui: ReactElement,
  options: TestRenderOptions = {}
): ReturnType<typeof testingLibraryRender> & { queryClient: QueryClient } {
  const { route, initialEntries, theme, auth, wrapper, ...rest } = options
  const queryClient = createTestQueryClient()

  if (auth) {
    setTestAuth(auth)
  }

  const result = testingLibraryRender(ui, {
    ...rest,
    wrapper: createWrapper(
      wrapper,
      { route, initialEntries, theme },
      queryClient
    ),
  })
  return Object.assign(result, { queryClient })
}

/** `renderHook` with the same providers and options as `render`. */
export function renderHook<Result, Props>(
  hook: (props: Props) => Result,
  options: Omit<RenderHookOptions<Props>, "wrapper"> &
    Omit<TestRenderOptions, keyof RenderOptions> & {
      wrapper?: TestWrapper
    } = {}
) {
  const { route, initialEntries, theme, auth, wrapper, ...rest } = options
  const queryClient = createTestQueryClient()

  if (auth) {
    setTestAuth(auth)
  }

  const result = testingLibraryRenderHook(hook, {
    ...rest,
    wrapper: createWrapper(
      wrapper,
      { route, initialEntries, theme },
      queryClient
    ),
  })
  return Object.assign(result, { queryClient })
}
