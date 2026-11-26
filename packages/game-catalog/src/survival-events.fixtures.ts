import { survivalEventSchema } from "./schemas"
import survivalEvents from "./schemas/survival-events.fixture.json"

// Served `survival-events` records (datamine 1.44.88): Crescendo A (global summon, adamantine medal) and
// December 2026 (dated, clone wave 16, Last Stand), with every wave kept and kill scores, chests,
// milestones and missions trimmed to keep the fixture small.
export const survivalEventsFixture = survivalEventSchema
  .array()
  .parse(survivalEvents)
