// Home Screen Event domain: token modes and supply, mode scoring, milestones, the event description
// and the event-points state. Shared by the Dailies HSE tab and the HSE team recommendations.
export { type HseText, type HseTextValue } from "./lib/hse-description"
export { hseMilestoneCells } from "./lib/hse-milestones"
export { type HseProjectionMode, hseModeScoring } from "./lib/hse-projection"
export {
  HSE_TOKEN_MODES,
  type HseManualTokenMode,
  type HseTokenMode,
  isHseManualTokenMode,
} from "./lib/hse-token-supply"
export {
  HSE_CAMPAIGN_MODES,
  type HseCatalogRead,
  type HseDetailsView,
  type HseEventPointsState,
  type HseInstance,
  type HsePlayerRead,
  type HseProjectionView,
  buildHseEventPointsState,
  hseSectionsShown,
} from "./model/hse-event-points"
export { useHseProjectionInputs } from "./model/use-hse-projection-inputs"
