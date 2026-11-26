import type { SurvivalEventStorageModel } from "@workspace/game-catalog"

/** One served Survival event (`survival-events`): its rules, waves, scoring, ladders and offers. */
export type SurvivalEvent = SurvivalEventStorageModel

export type SurvivalWave = SurvivalEvent["waves"][number]

export type SurvivalOffer = SurvivalEvent["offers"][number]

/** Where an event stands at a moment: undated events have no dates yet. */
export type SurvivalEventStatus = "running" | "upcoming" | "past" | "undated"
