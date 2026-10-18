import type { UnitPowerContext } from "@/shared/unit-power"
import { unitPowerContextFixture } from "@/test/fixtures/unit-power"

/** A map that answers every unknown key with `fallback`. */
class FallbackMap<K, V> extends Map<K, V> {
  private readonly fallback: V

  constructor(entries: Iterable<readonly [K, V]>, fallback: V) {
    super(entries)
    this.fallback = fallback
  }

  override get(key: K): V | undefined {
    return super.get(key) ?? this.fallback
  }
}

/** The real power context, where any character id the fixture lacks (the engine tests' "a",
 *  "strongA", …) reads Calgar's game data, so power still orders by rank, rarity and abilities. */
export function anyUnitPowerFixture(): UnitPowerContext {
  const context = unitPowerContextFixture()
  return {
    ...context,
    characters: new FallbackMap(
      context.characters,
      context.characters.get("ultraCalgar")!
    ),
  }
}
