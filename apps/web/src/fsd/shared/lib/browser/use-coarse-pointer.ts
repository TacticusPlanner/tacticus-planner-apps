import { useSyncExternalStore } from "react"

const COARSE_QUERY = "(pointer: coarse)"

/** Whether the primary pointer is coarse (a finger): hover never happens there, so a hint shown on
 *  hover has to open on tap instead (see `HintTrigger`). False where `matchMedia` is missing. */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(subscribe, isCoarsePointer, () => false)
}

function subscribe(onStoreChange: () => void) {
  if (!("matchMedia" in globalThis)) return () => undefined
  const query = globalThis.matchMedia(COARSE_QUERY)
  query.addEventListener("change", onStoreChange)
  return () => query.removeEventListener("change", onStoreChange)
}

function isCoarsePointer() {
  return (
    "matchMedia" in globalThis && globalThis.matchMedia(COARSE_QUERY).matches
  )
}
