import { ApiError } from "@/shared/api"

const HEX = "[0-9a-f]"
const HYPHENATED = `${HEX}{8}-${HEX}{4}-${HEX}{4}-${HEX}{4}-${HEX}{12}`
// The GUID spellings the API's `Guid.TryParse` accepts that a person would paste: hyphenated, bare
// 32 hex digits, or hyphenated inside braces or parentheses.
const GUID = new RegExp(
  `^(?:${HYPHENATED}|${HEX}{32}|\\{${HYPHENATED}\\}|\\(${HYPHENATED}\\))$`,
  "i"
)

/** Mirrors the API's rule for a Tacticus user id: a GUID (surrounding whitespace ignored). */
export function isTacticusUserId(raw: string): boolean {
  return GUID.test(raw.trim())
}

export type TacticusUserIdProblem = "invalid" | "inUse"

/**
 * The user-id field's problem in a failed `PUT account/tacticus-integration`: 409
 * `tacticusUserIdInUse` (another account already claims the id) or a 400 whose `errors` name the
 * user id (not a GUID). Null for any other failure, which stays a form-level message.
 */
export function tacticusUserIdProblem(
  error: unknown
): TacticusUserIdProblem | null {
  if (!(error instanceof ApiError)) return null
  if (error.issueCode === "tacticusUserIdInUse") return "inUse"
  if (
    error.status === 400 &&
    Object.keys(error.errors ?? {}).some(
      (field) => field.toLowerCase() === "tacticususerid"
    )
  ) {
    return "invalid"
  }
  return null
}
