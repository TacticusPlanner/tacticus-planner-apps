import { hreSchema } from "./schemas"
import hre from "./schemas/hre.fixture.json"

// The served `hre` records (datamine 1.43.157) as the store holds them: Weirdboy's and Eradicator's.
export const hreFixture = hreSchema.array().parse(hre)
