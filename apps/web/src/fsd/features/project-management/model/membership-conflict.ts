/** A rejected membership save. A stale one waits for an explicit refresh; the others mark the goals the
 * server named and clear as soon as the draft changes. */
export type MembershipConflict =
  | { kind: "stale"; message: string; currentGoalIds: string[] }
  | { kind: "slot" | "lastMembership"; message: string; goalIds: string[] }
