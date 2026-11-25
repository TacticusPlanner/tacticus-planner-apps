import type { QueryClient } from "@tanstack/react-query"

import { projectQueries } from "../api/project.queries"
import type { ProjectSummary } from "./types"

/** The project color swatches (plan §6): a small, generic accent palette. Any project can still
 *  pick an arbitrary color with the custom picker. */
export const PROJECT_PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#6b7280",
] as const

/** Gray reads as "no color" beside the outline dot, so the auto-pick skips it. */
const NEUTRAL_PRESET = "#6b7280"

const normalize = (color: string | null | undefined) =>
  (color ?? "").trim().toLowerCase()

/**
 * The color a new project starts with: a random non-gray preset no existing project uses, or,
 * once every one is taken, a random one among the least used, so colors spread evenly.
 * `random` returns a number in [0, 1), like `Math.random`.
 */
export function pickNewProjectColor(
  existingColors: readonly (string | null | undefined)[],
  random: () => number = Math.random
): string {
  const candidates = PROJECT_PRESET_COLORS.filter(
    (color) => color !== NEUTRAL_PRESET
  )
  const uses = new Map<string, number>(candidates.map((color) => [color, 0]))
  for (const color of existingColors) {
    const key = normalize(color)
    const count = uses.get(key)
    if (count !== undefined) uses.set(key, count + 1)
  }
  const fewest = Math.min(...uses.values())
  const leastUsed = candidates.filter((color) => uses.get(color) === fewest)
  const index = Math.min(
    leastUsed.length - 1,
    Math.floor(random() * leastUsed.length)
  )
  return leastUsed[index] ?? "#3b82f6"
}

/** A new project's color from the cached project list (empty while it has not loaded). */
export function newProjectColorFromCache(queryClient: QueryClient): string {
  const cached = queryClient.getQueryData<{ projects: ProjectSummary[] }>(
    projectQueries.list().queryKey
  )
  return pickNewProjectColor(
    (cached?.projects ?? []).map((project) => project.color)
  )
}
