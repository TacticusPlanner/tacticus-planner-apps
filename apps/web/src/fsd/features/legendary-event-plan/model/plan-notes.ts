/** The most characters a plan's notes may hold (the API's `LegendaryEventValidation.MaxNotesLength`). */
export const MAX_PLAN_NOTES_LENGTH = 2000

/** The notes to store for a draft: `null` when it holds only whitespace, otherwise the draft as
 *  typed, cut to `MAX_PLAN_NOTES_LENGTH`. */
export function normalizePlanNotes(draft: string): string | null {
  if (draft.trim() === "") return null
  return draft.slice(0, MAX_PLAN_NOTES_LENGTH)
}

/** Whether saving `draft` would change the stored notes. */
export function planNotesChanged(
  stored: string | null | undefined,
  draft: string
): boolean {
  return normalizePlanNotes(draft) !== (stored ?? null)
}
