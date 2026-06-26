import { z } from "zod"

export const manifestDatasetSchema = z.looseObject({
  key: z.string(),
  hash: z.string(),
  url: z.string(),
})

export const manifestSchema = z.looseObject({
  version: z.string(),
  schemaVersion: z.number(),
  gameVersion: z.string(),
  sourceHash: z.string(),
  datasets: z.array(manifestDatasetSchema),
})

// Envelope metadata; `data` is validated separately by the per-key payload schema.
export const datasetEnvelopeMetaSchema = z.looseObject({
  version: z.string(),
  schemaVersion: z.number(),
  gameVersion: z.string(),
  sourceHash: z.string(),
  datasetKey: z.string(),
  datasetHash: z.string(),
  data: z.unknown(),
})
