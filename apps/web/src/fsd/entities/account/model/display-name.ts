export const DISPLAY_NAME_MAX_LENGTH = 80

export type DisplayNameProblem = "empty" | "tooLong" | "controlCharacters"

/** Mirrors the API's rule for `PUT /me/display-name`; returns null when the name is acceptable. */
export function validateDisplayName(raw: string): DisplayNameProblem | null {
  const name = raw.trim()

  if (!name) {
    return "empty"
  }
  if (name.length > DISPLAY_NAME_MAX_LENGTH) {
    return "tooLong"
  }
  if (/\p{Cc}/u.test(name)) {
    return "controlCharacters"
  }

  return null
}
