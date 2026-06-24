import type { IPublicClientApplication } from "@azure/msal-browser"

import { fetchApi } from "@/shared/api"

import type {
  CatalogDatasetKey,
  CatalogDatasetResponse,
  CatalogManifest,
  CatalogManifestDataset,
} from "./catalog-sync"

export type CatalogManifestResult =
  | {
      etag: string | null
      manifest: CatalogManifest
      status: "ok"
    }
  | {
      status: "not-modified"
    }

export type CatalogClient = {
  getDataset: <TItem extends Record<string, unknown>>(
    dataset: CatalogManifestDataset
  ) => Promise<CatalogDatasetResponse<TItem>>
  getManifest: (etag?: string) => Promise<CatalogManifestResult>
}

export class CatalogHttpClient implements CatalogClient {
  private readonly msalInstance: IPublicClientApplication

  constructor(msalInstance: IPublicClientApplication) {
    this.msalInstance = msalInstance
  }

  async getManifest(etag?: string) {
    const headers = new Headers()

    if (etag) {
      headers.set("If-None-Match", etag)
    }

    const response = await fetchApi(
      this.msalInstance,
      "/api/v1/catalog/manifest",
      {
        headers,
      }
    )

    if (response.status === 304) {
      return { status: "not-modified" as const }
    }

    return {
      etag: response.headers.get("ETag"),
      manifest: (await response.json()) as CatalogManifest,
      status: "ok" as const,
    }
  }

  async getDataset<TItem extends Record<string, unknown>>(
    dataset: CatalogManifestDataset
  ) {
    const response = await fetchApi(this.msalInstance, dataset.url)
    const payload = (await response.json()) as CatalogDatasetResponse<TItem>

    if (payload.datasetKey !== dataset.key) {
      throw new Error(
        `Catalog dataset response key '${payload.datasetKey}' did not match requested key '${dataset.key}'.`
      )
    }

    return payload
  }
}

export function isCatalogDatasetKey(value: string): value is CatalogDatasetKey {
  return [
    "units",
    "mows",
    "upgrades",
    "equipment",
    "campaigns",
    "campaign-events",
    "campaign-battles",
    "lres",
  ].includes(value)
}
