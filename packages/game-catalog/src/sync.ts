// Loaded on demand (`await import("@workspace/game-catalog/sync")`) so the HTTP client and the zod
// schemas stay out of the app's entry bundle.
export {
  manifestSchema,
  datasetEnvelopeMetaSchema,
  datasetPayloadSchemas,
} from "./schemas"

export { GameCatalogHttpClient } from "./game-catalog-api"

export { syncGameCatalog, selectChangedDatasets } from "./game-catalog-sync"
