import {
  ManageProjectsSheet,
  useProjectActions,
} from "@/features/project-management"

/** The blank project-creation sheet the project quick-nav's Create project control opens. The
 *  caller owns `open`, so opening, saving or failing never touches the route or the membership
 *  filter; the sheet itself keeps the entered fields when a save fails. */
export function GoalsCreateProjectSheet({
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
