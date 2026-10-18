import { hseConfigSchema } from "./schemas"
import type {
  GameCatalogHseConfig,
  GameCatalogHseRestriction,
  GameCatalogHseVariant,
} from "./types"

/**
 * Reads `config.hse` from a served event definition's `config`: the parsed scoring, or null when the
 * definition has none (Against the Tide, any non-HSE definition) or it does not match the contract.
 */
export function parseHseConfig(config: unknown): GameCatalogHseConfig | null {
  if (typeof config !== "object" || config === null) return null
  const hse = (config as { hse?: unknown }).hse
  if (hse === undefined || hse === null) return null
  const parsed = hseConfigSchema.safeParse(hse)
  return parsed.success ? parsed.data : null
}

/**
 * The variant an HSE occurrence plays (the server applies the same rule and never sends a resolved
 * field): the one keyed by `parameters.hseVariant` when set; else the one keyed by
 * `parameters.targetFactionId` when it exists; else `default`. Null when none of those exists.
 */
export function resolveHseVariant(
  hse: Pick<GameCatalogHseConfig, "variants">,
  parameters: Readonly<Record<string, unknown>> | null | undefined
): GameCatalogHseVariant | null {
  const byKey = (key: unknown) =>
    typeof key === "string"
      ? hse.variants.find((variant) => variant.variantKey === key)
      : undefined
  const named = parameters?.hseVariant
  if (typeof named === "string" && named) return byKey(named) ?? null
  return byKey(parameters?.targetFactionId) ?? byKey("default") ?? null
}

/** True when `value` passes the restriction (null passes everything). */
export function hseRestrictionPasses(
  restriction: GameCatalogHseRestriction | null,
  value: string
): boolean {
  if (!restriction) return true
  if (restriction.disallowed?.includes(value)) return false
  return restriction.allowed ? restriction.allowed.includes(value) : true
}
