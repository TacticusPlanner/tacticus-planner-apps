import { questCrateSchema, questEventSchema } from "./schemas"
import questCrates from "./schemas/quest-crates.fixture.json"
import questEvents from "./schemas/quest-events.fixture.json"

export const questEventsFixture = questEventSchema.array().parse(questEvents)
export const questCratesFixture = questCrateSchema.array().parse(questCrates)
