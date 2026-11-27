/** Whether `value` is a plain object (not `null`, not an array), for narrowing parsed JSON. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
