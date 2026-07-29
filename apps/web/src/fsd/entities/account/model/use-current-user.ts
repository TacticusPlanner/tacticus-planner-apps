import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { accountQueries } from "../api/account.queries"
import type { CurrentUser } from "./current-user"

export type CurrentUserState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; user: CurrentUser }
  | { status: "error"; error: unknown }

export function useCurrentUser() {
  const isAuthenticated = useIsAuthenticated()
  const query = useQuery({
    ...accountQueries.current(),
    enabled: isAuthenticated,
  })

  let state: CurrentUserState
  if (!isAuthenticated) {
    state = { status: "idle" }
  } else if (query.isPending) {
    state = { status: "loading" }
  } else if (query.isError) {
    state = { status: "error", error: query.error }
  } else {
    state = { status: "success", user: query.data }
  }

  return {
    state,
    refetch: () => {
      void query.refetch()
    },
  }
}
