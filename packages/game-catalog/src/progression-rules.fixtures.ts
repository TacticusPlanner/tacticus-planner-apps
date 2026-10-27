import { progressionRulesSchema } from "./schemas"
import progressionRules from "./schemas/progression-rules.fixture.json"

// The served `progression-rules` record (datamine 1.43.157) as the store holds it.
export const progressionRulesFixture = {
  id: "progression-rules",
  ...progressionRulesSchema.array().parse(progressionRules)[0]!,
}
