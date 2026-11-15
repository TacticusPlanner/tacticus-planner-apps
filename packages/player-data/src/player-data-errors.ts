/** The API refused a sync because this profile used up its hourly budget; nothing about the data is wrong. */
export class PlayerDataRateLimitError extends Error {
  readonly retryAfterSeconds?: number

  constructor(retryAfterSeconds?: number) {
    super("Too many player-data sync requests.")
    this.name = "PlayerDataRateLimitError"
    this.retryAfterSeconds = retryAfterSeconds
  }
}
