import { useCallback, useState } from "react"

import { safeStorage } from "@/shared/lib"

import {
  parseCompareFields,
  serializeCompareFields,
  type CompareField,
} from "./compare-view"

const FIELDS_STORAGE_KEY = "collection.compare.fields"

/** The compare fields setting, remembered on this device (never in the URL); all on when storage
 *  is unavailable or holds nothing valid. */
export function useCompareFields(): [
  ReadonlySet<CompareField>,
  (next: ReadonlySet<CompareField>) => void,
] {
  const [fields, setFieldsState] = useState(() =>
    parseCompareFields(safeStorage.get(FIELDS_STORAGE_KEY))
  )
  const setFields = useCallback((next: ReadonlySet<CompareField>) => {
    setFieldsState(new Set(next))
    safeStorage.set(FIELDS_STORAGE_KEY, serializeCompareFields(next))
  }, [])
  return [fields, setFields]
}
