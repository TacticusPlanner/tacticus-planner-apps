import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  createProject,
  projectQueries,
  type ProjectSummary,
} from "@/entities/project"

/**
 * Creates an ordinary custom project from inside the goal membership picker. The project is written
 * into the cached list before it is returned so the caller can select it at once — both goal forms
 * drop selected IDs that are not in the loaded project list — and the list is then refreshed so the
 * chip carries the server's real name and color. Errors propagate to the caller, which owns the
 * in-place message, so nothing here toasts.
 */
export function useInlineProjectCreate() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (name: string) =>
      createProject({ name, description: null, color: null }),
    onSuccess: (created: ProjectSummary) => {
      queryClient.setQueryData(
        projectQueries.list().queryKey,
        (current: { projects: ProjectSummary[] } | undefined) =>
          current
            ? { ...current, projects: [...current.projects, created] }
            : current
      )
      void queryClient.invalidateQueries({ queryKey: projectQueries.all() })
    },
  })

  return { create: mutation.mutateAsync, pending: mutation.isPending }
}
