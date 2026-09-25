import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateDisplayName } from "../api/account.api"
import { accountQueries } from "../api/account.queries"

/**
 * Saves the confirmed name and resolves only after `/me` has been refetched, so callers awaiting
 * `mutateAsync` see the canonical confirmed state — the public name is never promoted optimistically.
 */
export function useUpdateDisplayName() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateDisplayName,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountQueries.all() }),
  })
}
