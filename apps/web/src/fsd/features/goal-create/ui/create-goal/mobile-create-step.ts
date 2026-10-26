/** The mobile create flow's steps, in order (goal-creation: mobile creation is a three-step flow). */
export const MOBILE_CREATE_STEPS = ["unit", "goals", "review"] as const

export type MobileCreateStep = (typeof MOBILE_CREATE_STEPS)[number]
