import { useCallback } from "react"

import {
  storedPreference,
  useStoredPreference,
  writePreference,
} from "@/shared/lib"

import { parseCompareFields, serializeCompareFields } from "./compare-view"
import type { CompareField } from "./compare-view"

const COMPARE_FIELDS = storedPreference("collection", "compareFields")

const parseStored = (stored: unknown): ReadonlySet<CompareField> =>
  parseCompareFields(typeof stored === "string" ? stored : null)

/** The compare fields setting, remembered on this device (never in the URL); all on when storage
 *  is unavailable or holds nothing valid. */
export function useCompareFields(): [
  ReadonlySet<CompareField>,
  (next: ReadonlySet<CompareField>) => void,
] {
  const [fields] = useStoredPreference(COMPARE_FIELDS, parseStored)
  const setFields = useCallback((next: ReadonlySet<CompareField>) => {
    writePreference(COMPARE_FIELDS, serializeCompareFields(next))
  }, [])
  return [fields, setFields]
}
