import { incursionSchema } from "./schemas"
import incursions from "./schemas/incursions.fixture.json"

// Served `incursions` records (datamine 1.43.157), trimmed to keep the fixture small: the Broadside's
// tiers 0 and 12 (Common, Mythic) and the Reanimator's tier 0, keyed as the store keys them.
export const incursionsFixture = incursionSchema
  .array()
  .parse(incursions)
  .map((incursion) => ({ id: incursion.mowId, ...incursion }))
