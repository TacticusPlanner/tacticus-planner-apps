import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  createProject,
  newProjectColorFromCache,
  projectQueries,
} from "@/entities/project"
import type { ProjectSummary } from "@/entities/project"

/**
 * Creates an ordinary custom project from inside the goal membership picker. The project is written
 * into the cached list before it is returned so the caller can select it at once — both goal forms
 * drop selected IDs that are not in the loaded project list. A new project starts with an unused preset color, as in
 * the New project form. The response already carries the server's
 * name and color, so nothing is refetched. Errors propagate to the caller, which owns the in-place
 * message, so nothing here toasts.
 */
export function useInlineProjectCreate() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (name: string) =>
      createProject({
        name,
        description: null,
        // The same unused preset the New project form starts with.
        color: newProjectColorFromCache(queryClient),
      }),
    onSuccess: (created: ProjectSummary) => {
      queryClient.setQueryData(
        projectQueries.list().queryKey,
        (current: { projects: ProjectSummary[] } | undefined) =>
          current
            ? { ...current, projects: [...current.projects, created] }
            : current
      )
    },
  })

  return { create: mutation.mutateAsync, pending: mutation.isPending }
}
