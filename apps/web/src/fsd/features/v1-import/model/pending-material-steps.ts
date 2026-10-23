import { useSyncExternalStore } from "react"
import { z } from "zod"

import { safeStorage } from "@/shared/lib"

import type { MaterialStep } from "./outcome-buckets"

const STORAGE_KEY = "v1-import.pending-material-steps"

const unitSchema = z.object({ entityType: z.string(), entityId: z.string() })
const stepsSchema = z.array(
  z.object({
    sourceGoalId: z.string().nullable(),
    upgradeId: z.string().nullable(),
    quantity: z.number().nullable(),
    linkedUnits: z.array(unitSchema),
    units: z.array(unitSchema),
  })
)

const EMPTY: readonly MaterialStep[] = []
const listeners = new Set<() => void>()
let cache: { raw: string | null; steps: readonly MaterialStep[] } | null = null

function read(): readonly MaterialStep[] {
  const raw = safeStorage.get(STORAGE_KEY)
  if (cache?.raw === raw) return cache.steps
  let steps: readonly MaterialStep[] = EMPTY
  if (raw) {
    try {
      const parsed = stepsSchema.safeParse(JSON.parse(raw))
      if (parsed.success) steps = parsed.data
    } catch {
      // A corrupt entry reads as nothing pending.
    }
  }
  cache = { raw, steps }
  return steps
}

function notify() {
  for (const listener of listeners) listener()
}

/**
 * Keeps the last import's material steps (V1 material and pre-farm goals that need an Upgrade goal
 * created by hand) until the user dismisses them, so they outlive the import report — above all the
 * account-setup one, which has no goal-creation sheet to act on them with. An import with no steps
 * leaves an earlier list alone; only dismissing clears it.
 */
export function savePendingMaterialSteps(steps: readonly MaterialStep[]) {
  if (steps.length === 0) return
  safeStorage.set(STORAGE_KEY, JSON.stringify(steps))
  notify()
}

export function clearPendingMaterialSteps() {
  safeStorage.remove(STORAGE_KEY)
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePendingMaterialSteps(): readonly MaterialStep[] {
  return useSyncExternalStore(subscribe, read)
}
