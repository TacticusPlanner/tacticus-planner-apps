import { globalValuesSchema } from "./schemas"
import globalValues from "./schemas/global-values.fixture.json"

// The served `global-values` record (datamine 1.43.157) as the store holds it.
export const globalValuesFixture = {
  id: "global-values",
  ...globalValuesSchema.array().parse(globalValues)[0]!,
}
