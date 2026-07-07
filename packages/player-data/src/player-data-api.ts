import { isPlayerDataChunkKey } from "./chunk-keys"
import {
  playerDataChunkEnvelopeMetaSchema,
  playerDataChunkPayloadSchemas,
  playerDataManifestSchema,
} from "./schemas"
import type {
  PlayerDataChunkEnvelope,
  PlayerDataChunkKey,
  PlayerDataManifest,
  PlayerDataManifestChunk,
} from "./types"

export type PlayerDataClient = {
  triggerSync: () => Promise<PlayerDataManifest>
  getChunk: (chunk: PlayerDataManifestChunk) => Promise<PlayerDataChunkEnvelope>
}

const syncPath = "/api/v1/tacticus-integration/player-sync"

/**
 * Authenticated HTTP client for the per-profile player-data API. Unlike the anonymous game-catalog
 * client, every request attaches a bearer token — the caller supplies a `getAccessToken` provider
 * (e.g. wrapping MSAL's `acquireTokenSilent`) so this package stays decoupled from any specific auth
 * library. Every response is zod-validated at this (untrusted) boundary; a malformed payload throws.
 */
export class PlayerDataHttpClient implements PlayerDataClient {
  private readonly baseUrl: string
  private readonly getAccessToken: () => Promise<string>

  constructor(baseUrl: string, getAccessToken: () => Promise<string>) {
    const trimmed = baseUrl.trim()

    if (!trimmed) {
      throw new Error("PlayerDataHttpClient requires a non-empty base URL.")
    }

    this.baseUrl = trimmed
    this.getAccessToken = getAccessToken
  }

  async triggerSync(): Promise<PlayerDataManifest> {
    const response = await this.authorizedFetch(syncPath, { method: "POST" })

    if (!response.ok) {
      throw new Error(
        `PlayerData sync request failed with status ${response.status}.`
      )
    }

    const parsed = playerDataManifestSchema.safeParse(await response.json())

    if (!parsed.success) {
      throw new Error(
        `PlayerData sync response failed validation: ${parsed.error.message}`
      )
    }

    return parsed.data
  }

  async getChunk(
    chunk: PlayerDataManifestChunk
  ): Promise<PlayerDataChunkEnvelope> {
    const response = await this.authorizedFetch(chunk.url)

    if (!response.ok) {
      throw new Error(
        `PlayerData chunk '${chunk.key}' request failed with status ${response.status}.`
      )
    }

    const envelope = playerDataChunkEnvelopeMetaSchema.safeParse(
      await response.json()
    )

    if (!envelope.success) {
      throw new Error(
        `PlayerData chunk '${chunk.key}' envelope failed validation: ${envelope.error.message}`
      )
    }

    if (envelope.data.chunkKey !== chunk.key) {
      throw new Error(
        `PlayerData chunk response key '${envelope.data.chunkKey}' did not match requested key '${chunk.key}'.`
      )
    }

    if (!isPlayerDataChunkKey(chunk.key)) {
      throw new Error(`PlayerData chunk '${chunk.key}' is not a known chunk.`)
    }

    const payload = playerDataChunkPayloadSchemas[
      chunk.key as PlayerDataChunkKey
    ].safeParse(envelope.data.data)

    if (!payload.success) {
      throw new Error(
        `PlayerData chunk '${chunk.key}' failed validation: ${payload.error.message}`
      )
    }

    return { ...envelope.data, data: payload.data }
  }

  private async authorizedFetch(
    path: string,
    init: RequestInit = {}
  ): Promise<Response> {
    const accessToken = await this.getAccessToken()
    const headers = new Headers(init.headers)
    headers.set("Authorization", `Bearer ${accessToken}`)

    return fetch(new URL(path, this.baseUrl), { ...init, headers })
  }
}
