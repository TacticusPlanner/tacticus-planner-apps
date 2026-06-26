import { isServedDatasetKey } from "./dataset-keys"
import {
  datasetEnvelopeMetaSchema,
  datasetPayloadSchemas,
  manifestSchema,
} from "./schemas"
import type {
  CatalogDatasetEnvelope,
  CatalogManifest,
  CatalogManifestDataset,
} from "./types"

export type CatalogManifestResult =
  | { status: "ok"; etag: string | null; manifest: CatalogManifest }
  | { status: "not-modified" }

export type CatalogClient = {
  getManifest: (etag?: string) => Promise<CatalogManifestResult>
  getDataset: (
    dataset: CatalogManifestDataset
  ) => Promise<CatalogDatasetEnvelope>
}

const manifestPath = "/api/v1/game-catalog/manifest"

/**
 * Anonymous HTTP client for the catalog API. The catalog endpoints are public, so no auth token is
 * attached. Every response is validated against its zod schema at this (untrusted) boundary; a
 * malformed payload throws, which surfaces as a sync error in the init loader.
 */
export class CatalogHttpClient implements CatalogClient {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    const trimmed = baseUrl.trim()

    if (!trimmed) {
      throw new Error("CatalogHttpClient requires a non-empty base URL.")
    }

    this.baseUrl = trimmed
  }

  async getManifest(etag?: string): Promise<CatalogManifestResult> {
    const headers = new Headers()

    if (etag) {
      headers.set("If-None-Match", etag)
    }

    const response = await fetch(new URL(manifestPath, this.baseUrl), {
      headers,
    })

    if (response.status === 304) {
      return { status: "not-modified" }
    }

    if (!response.ok) {
      throw new Error(
        `Catalog manifest request failed with status ${response.status}.`
      )
    }

    const parsed = manifestSchema.safeParse(await response.json())

    if (!parsed.success) {
      throw new Error(
        `Catalog manifest failed validation: ${parsed.error.message}`
      )
    }

    return {
      status: "ok",
      etag: response.headers.get("ETag"),
      manifest: parsed.data,
    }
  }

  async getDataset(
    dataset: CatalogManifestDataset
  ): Promise<CatalogDatasetEnvelope> {
    const response = await fetch(new URL(dataset.url, this.baseUrl))

    if (!response.ok) {
      throw new Error(
        `Catalog dataset '${dataset.key}' request failed with status ${response.status}.`
      )
    }

    const envelope = datasetEnvelopeMetaSchema.safeParse(await response.json())

    if (!envelope.success) {
      throw new Error(
        `Catalog dataset '${dataset.key}' envelope failed validation: ${envelope.error.message}`
      )
    }

    if (envelope.data.datasetKey !== dataset.key) {
      throw new Error(
        `Catalog dataset response key '${envelope.data.datasetKey}' did not match requested key '${dataset.key}'.`
      )
    }

    if (!isServedDatasetKey(dataset.key)) {
      throw new Error(
        `Catalog dataset '${dataset.key}' is not a known served dataset.`
      )
    }

    const payload = datasetPayloadSchemas[dataset.key].safeParse(
      envelope.data.data
    )

    if (!payload.success) {
      throw new Error(
        `Catalog dataset '${dataset.key}' failed validation: ${payload.error.message}`
      )
    }

    return { ...envelope.data, data: payload.data }
  }
}
