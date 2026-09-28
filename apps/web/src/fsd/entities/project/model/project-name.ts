/** Mirrors the API's `ProjectValidation.MaxNameLength`. */
export const PROJECT_NAME_MAX_LENGTH = 120

/** The one client-side project naming rule: a trimmed name is required and must fit the API's limit.
 * Shared by every surface that creates a project so none of them is looser than another. */
export function isProjectNameValid(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= PROJECT_NAME_MAX_LENGTH
}
