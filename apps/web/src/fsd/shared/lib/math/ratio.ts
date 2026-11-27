/** `value` held to 0–1, the range a progress bar or share reads. */
export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/** How much of `total` is `done`, held to 0–1. Nothing to do (`total` ≤ 0) counts as complete. */
export function clampRatio(done: number, total: number): number {
  if (total <= 0) return 1
  return clamp01(done / total)
}
