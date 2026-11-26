import { useCallback, useMemo, useSyncExternalStore } from "react"

import { isSessionStorageEvent, safeStorage } from "./safe-storage"
import { preferenceRecordKey } from "./storage-keys"
import type { PreferenceField, PreferenceRecord } from "./storage-keys"

/** One field of a per-device preference record (`tp.<record>` = `{ <field>: value, … }`). */
export interface StoredPreference<
  R extends PreferenceRecord = PreferenceRecord,
> {
  readonly record: R
  readonly field: PreferenceField<R>
}

export function storedPreference<R extends PreferenceRecord>(
  record: R,
  field: PreferenceField<R>
): StoredPreference<R> {
  return { record, field }
}

type StoredRecord = Readonly<Record<string, unknown>>

// The last raw string read per record and what it parsed to, so a read returns the same object
// until the stored text changes (useSyncExternalStore compares snapshots by identity).
const parsedRecords = new Map<
  string,
  { raw: string | null; value: StoredRecord }
>()

function parseRecord(raw: string | null): StoredRecord {
  if (raw === null) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as StoredRecord)
      : {}
  } catch {
    return {}
  }
}

// Records whose last write did not land (storage blocked or full): they apply for this visit, as
// the in-memory fallback the spec asks for, until a later write lands.
const unsavedRecords = new Map<string, StoredRecord>()

/** Drops the values whose writes did not land; tests call it between cases. */
export function forgetUnsavedPreferences(): void {
  unsavedRecords.clear()
}

/** The stored record, `{}` when nothing (or nothing readable) is stored. */
function readPreferenceRecord(record: PreferenceRecord): StoredRecord {
  const key = preferenceRecordKey(record)
  const unsaved = unsavedRecords.get(key)
  if (unsaved) return unsaved
  const raw = safeStorage.get(key)
  const cached = parsedRecords.get(key)
  if (cached?.raw === raw) return cached.value
  const value = parseRecord(raw)
  parsedRecords.set(key, { raw, value })
  return value
}

/** The field's stored value as written, `undefined` when unset. Callers validate it. */
export function readPreference(preference: StoredPreference): unknown {
  return readPreferenceRecord(preference.record)[preference.field]
}

const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

function onStorage(event: StorageEvent) {
  // Another tab changed a key (`key` is null when it cleared storage); its sessionStorage is its own.
  if (!isSessionStorageEvent(event)) notify()
}

/** Calls `listener` when any preference changes, in this page or in another tab. */
function subscribePreferences(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener("storage", onStorage)
  }
}

/**
 * Stores `value` in the field (`undefined` removes it) and tells every reader on the page. Returns
 * whether the write landed; when it did not, the value still applies until the page is left.
 */
export function writePreference(
  preference: StoredPreference,
  value: unknown
): boolean {
  const { record, field } = preference
  const rest = Object.fromEntries(
    Object.entries(readPreferenceRecord(record)).filter(
      ([name]) => name !== field
    )
  )
  const next = value === undefined ? rest : { ...rest, [field]: value }
  const key = preferenceRecordKey(record)
  const landed =
    Object.keys(next).length === 0
      ? (safeStorage.remove(key), safeStorage.get(key) === null)
      : safeStorage.trySet(key, JSON.stringify(next))
  if (landed) unsavedRecords.delete(key)
  else unsavedRecords.set(key, next)
  notify()
  return landed
}

/**
 * A stored preference as React state: every mounted reader, in this page and other tabs, sees a
 * change at once. `parse` turns the stored value (`undefined` when unset, or anything a different
 * build wrote) into the value to use, falling back to a default. A `parse` that builds an object
 * should be a module-level function: the result is kept until the stored value or `parse` changes.
 */
export function useStoredPreference<T>(
  preference: StoredPreference,
  parse: (stored: unknown) => T
): [T, (next: T) => void] {
  const { record, field } = preference
  const stored = useSyncExternalStore(
    subscribePreferences,
    () => readPreferenceRecord(record)[field],
    () => undefined
  )
  const set = useCallback(
    (next: T) => {
      writePreference({ record, field }, next)
    },
    [record, field]
  )
  const value = useMemo(() => parse(stored), [parse, stored])
  return [value, set]
}

/** A remembered open/closed (or on/off) flag; `fallback` until the player toggles it. */
export function useStoredFlag(
  preference: StoredPreference,
  fallback = false
): [boolean, (next: boolean) => void] {
  return useStoredPreference(preference, (stored) =>
    typeof stored === "boolean" ? stored : fallback
  )
}
