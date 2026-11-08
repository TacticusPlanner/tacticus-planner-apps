/** An enemy NPC's threat text from the `npcThreats` locale namespace (keyed by npc id): why it is
 *  dangerous and how to deal with it. Each field is absent when the namespace has no text for it. */
export interface NpcThreatText {
  threat?: string
  counter?: string
}

const THREAT_FIELDS = ["threat", "counter"] as const

/** The non-blank string fields of one `npcThreats` entry; anything else is ignored. */
export function parseNpcThreatText(value: unknown): NpcThreatText {
  if (typeof value !== "object" || value === null) return {}
  const entry = value as Record<string, unknown>
  const text: NpcThreatText = {}
  for (const field of THREAT_FIELDS) {
    const fieldValue = entry[field]
    if (typeof fieldValue === "string" && fieldValue.trim() !== "") {
      text[field] = fieldValue
    }
  }
  return text
}
