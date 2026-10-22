export type ProjectRemovalUnavailableReason =
  /** The chosen destination *is* the project being removed from, so relocation has no destination.
   *  Named for its original, only caller (the membership editor, which always targets Default) —
   *  the goal row's own "Move to project" action reuses this same reason when a chosen destination
   *  somehow equals the viewed project, which its own picker (excludes the viewed project) never
   *  actually offers in practice. */
  | "lastMembershipIsDefault"
  /** The destination isn't known yet — the projects query is pending, errored, or the user is
   *  unauthenticated. Submitting would serialize `[null]` and fail the ownership check with a 400. */
  | "destinationUnknown"

/** Whether `projectId` is the row's only project — removing it from there needs a destination. A row
 *  whose memberships are not known yet counts as not, so it is never relocated on a guess. */
export function isOnlyMemberOf(
  row: { projects?: readonly { projectId: string }[] },
  projectId: string
): boolean {
  const projects = row.projects ?? []
  return projects.length > 0 && projects.every((p) => p.projectId === projectId)
}
