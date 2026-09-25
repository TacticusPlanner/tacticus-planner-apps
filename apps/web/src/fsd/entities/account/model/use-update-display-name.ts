import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateDisplayName } from "../api/account.api"
import { accountQueries } from "../api/account.queries"

/**
 * Saves the name and resolves only after `/me` has been refetched, so callers awaiting
 * `mutateAsync` see the canonical state — the public name is never promoted optimistically. A failed
 * refetch rejects (throwOnError), so it is never reported as a completed save; retrying re-sends the
 * same name, which is idempotent.
 */
export function useUpdateDisplayName() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateDisplayName,
    onSuccess: () =>
      queryClient.invalidateQueries(
        { queryKey: accountQueries.all() },
        { throwOnError: true }
      ),
  })
}
