import { z } from "zod"

// The curated clear-estimate parameters (legendary-event-clear-estimate dataset): a single record.
// `calibration.sampleCount` 0 means uncalibrated.
export const legendaryEventClearEstimateSchema = z.looseObject({
  id: z.string(),
  powerRatio: z.number().positive(),
  calibration: z.looseObject({
    sampleCount: z.number().int().nonnegative(),
    calibratedOn: z.string().nullable(),
  }),
})
