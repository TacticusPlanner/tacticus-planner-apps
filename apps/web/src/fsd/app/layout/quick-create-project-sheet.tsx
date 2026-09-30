import {
  ManageProjectsSheet,
  useProjectActions,
} from "@/features/project-management"

/** Shell-level "New project" form launched from search quick actions: the existing create-mode
 *  ManageProjectsSheet (blank form, validation, pending state, error toasts, cache refresh), mounted
 *  over whatever page is open instead of navigating to Projects. */
export function QuickCreateProjectSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const actions = useProjectActions()

  return (
    <ManageProjectsSheet
      actions={actions}
      onOpenChange={onOpenChange}
      open={open}
      project={undefined}
    />
  )
}
