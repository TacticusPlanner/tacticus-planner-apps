import { guildWarSeasonSchema } from "./schemas"
import guildWar from "./schemas/guild-war.fixture.json"

// Served `guild-war` records (datamine 1.44.88): Seasons A and D, with buff values and map pools
// trimmed to keep the fixture small.
export const guildWarFixture = guildWarSeasonSchema.array().parse(guildWar)
