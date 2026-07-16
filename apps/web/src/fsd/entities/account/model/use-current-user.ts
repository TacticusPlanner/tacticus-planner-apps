import { useQuery } from "@tanstack/react-query"

import { useActiveAccountId } from "@/shared/auth"

import { accountQueries } from "../api/account.queries"
import type { CurrentUser } from "./current-user"

export type CurrentUserState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; user: CurrentUser }
  | { status: "error"; error: unknown }

export function useCurrentUser() {
  const accountId = useActiveAccountId()
  const query = useQuery({
    ...accountQueries.current(accountId ?? "anonymous"),
    enabled: Boolean(accountId),
  })

  let state: CurrentUserState
  if (!accountId) {
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
