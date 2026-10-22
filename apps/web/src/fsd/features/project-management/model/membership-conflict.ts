/** A rejected membership save. A stale one waits for an explicit refresh; a last-membership one marks the
 * goals the server named and clears as soon as the draft changes. Membership is never slot-checked. */
export type MembershipConflict =
  | { kind: "stale"; message: string; currentGoalIds: string[] }
  | { kind: "lastMembership"; message: string; goalIds: string[] }
