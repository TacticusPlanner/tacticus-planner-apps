/** What a link to the V1 import page carries so its back arrow returns there. */
interface V1ImportReturnState {
  v1ImportReturnTo: string
}

const FALLBACK = "/home"

/** The navigation state for a link to the V1 import page from `path` (an in-app path). */
export function v1ImportReturnState(path: string): V1ImportReturnState {
  return { v1ImportReturnTo: path }
}

/**
 * Where the V1 import page's back arrow goes: the in-app page that linked to it, or Home when it
 * was opened directly (the account menu, a reload, a typed address).
 */
export function v1ImportReturnPath(state: unknown): string {
  const path = (state as Partial<V1ImportReturnState> | null | undefined)
    ?.v1ImportReturnTo
  // Only a path inside the app: never another origin (`//host`) or a full URL.
  return typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//")
    ? path
    : FALLBACK
}
